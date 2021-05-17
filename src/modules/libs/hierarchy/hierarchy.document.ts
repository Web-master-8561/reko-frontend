import { Base, BaseDocument } from '@kifly/boxer/src/document/base.document';
import { document } from '@kifly/boxer/src/document/decorators/document';
import { ref } from '@kifly/boxer/src/document/decorators/ref';
import { refs } from '@kifly/boxer/src/document/decorators/refs';
import { DefaultScope } from '@kifly/boxer/src/scope/default.scope';
import { uniqBy } from 'lodash';

export interface Hierarchy extends Base {
    children?: Hierarchy[];
    parent?: Hierarchy[];
}

@document({
    collection: 'hierarchy',
    indices: [
        { fieldOrSpec: { parent: 1 } },
        { fieldOrSpec: { children: 1 } }
    ]
})
export class HierarchyDocument<T extends Base> extends BaseDocument<T> {
    /**
     * You have to override this property with your own Document (extended by HierarchyDocument)
     */
    @ref(() => HierarchyDocument)
    public parent: HierarchyDocument<T>;

    /**
     * You have to override this property with your own Document (extended by HierarchyDocument)
     */
    @refs(() => HierarchyDocument)
    public children: HierarchyDocument<T>[] = [];

    public readAsPublic() {
        return {
            ...this,
            lastPopulateOptions: null,
            children: this.children.map((item) => item?.readAsPublic ? item.readAsPublic() : item),
            parent: this.parent?.readAsPublic ? this.parent.readAsPublic() : this.parent
        };
    }

    public async loadChildren(): Promise<void> {
        try {
            await this.populate([
                { path: 'children', scope: DefaultScope }
            ]);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async loadChildrenDeep(): Promise<void> {
        try {
            await this.loadChildren();

            for (const child of this.children) {
                await child.loadChildrenDeep();
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async loadParent(): Promise<void> {
        try {
            await this.populate([
                { path: 'parent', scope: DefaultScope }
            ]);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async loadParentDeep(): Promise<void> {
        try {
            await this.loadParent();

            if (this.hasParent()) {
                await this.parent.loadParentDeep();
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public setParent(doc: HierarchyDocument<T> | null): void {
        this.parent = doc;
    }

    public addChild(doc: HierarchyDocument<T>): void {
        this.children = this.children || [];
        this.children.push(doc);

        /**
         * Unique array
         */
        this.children = uniqBy(this.children, (child: HierarchyDocument<T>) => (child._id || child).toString());
    }

    public removeChild(doc: HierarchyDocument<T>): void {
        this.children = this.children.filter((item) => (item._id || item).toString() !== (doc._id || doc).toString());
    }

    public hasChildren(): boolean {
        return !!this.children.length;
    }

    public hasParent(): boolean {
        return !!this.parent;
    }
}
