import { injectable } from '@kifly/beagle/core/container/decorators/injectable';
import { Repository } from '@kifly/beagle/modules/boxer/repository/repository';
import { FindManyOptions } from '@kifly/boxer/src/collections/collection';
import { Hierarchy, HierarchyDocument } from './hierarchy.document';

@injectable()
export class HierarchyService<T extends Hierarchy> {
    public repository: Repository<HierarchyDocument<T>>;

    public async getRoot(loadChildren: boolean = true, options: FindManyOptions<any> = {}): Promise<HierarchyDocument<T>[]> {
        try {
            const query = { parent: null };

            const items = await this.repository.findMany(query, options);

            for (const item of items) {
                if (loadChildren) {
                    await item.loadChildrenDeep();
                }
            }

            return items.map((item) => item.readAsPublic());
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async setParent(document: HierarchyDocument<T>, parent: HierarchyDocument<T>): Promise<void> {
        try {
            const isChildOf = await this.isChildOfDeep(parent, document);

            if (isChildOf) {
                throw new Error('UnableToSetParentPreventCircularDependency');
            }

            document.setParent(parent);

            await document.save();

            const isAlreadyChildOf = await this.isChildOf(document, parent);

            if (!isAlreadyChildOf) {
                await this.addChild(parent, document);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async removeParent(child: HierarchyDocument<T>) {
        try {
            await child.loadParent();

            const parent = child.parent;

            child.setParent(null);

            await child.save();

            const isChildOf = await this.isChildOf(child, parent);

            if (isChildOf) {
                await this.removeChild(parent, child);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async addChild(document: HierarchyDocument<T>, child: HierarchyDocument<T>): Promise<void> {
        try {
            const isParentOf = await this.isParentOfDeep(child, document);

            if (isParentOf) {
                throw new Error('UnableToAddChildPreventCircularDependency');
            }

            document.addChild(child);

            await document.save();

            const isAlreadyParentOf = await this.isParentOf(document, child);

            if (!isAlreadyParentOf) {
                await this.setParent(child, document);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async removeChild(document: HierarchyDocument<T>, child: HierarchyDocument<T>): Promise<void> {
        try {
            const isChildOf = await this.isChildOf(document, child);

            if (!isChildOf) {
                throw new Error('UnknownChild');
            }

            document.removeChild(child);

            await document.save();

            const isParentOf = await this.isParentOf(document, child);

            if (isParentOf) {
                await this.removeParent(child);
            }
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async isChildOf(document: HierarchyDocument<T>, parent: HierarchyDocument<T>): Promise<boolean> {
        try {
            await parent.loadChildren();

            return !!parent.children.find((item) => (item._id || item).toString() === (document._id || document).toString());
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async isChildOfDeep(document: HierarchyDocument<T>, parent: HierarchyDocument<T>): Promise<boolean> {
        try {
            await parent.loadChildren();

            for (const item of parent.children) {
                const foundChild = await this.isChildOfDeep(document, item);

                if (foundChild) {
                    return true;
                }
            }

            return this.isChildOf(document, parent);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async isParentOf(document: HierarchyDocument<T>, child: HierarchyDocument<T>): Promise<boolean> {
        try {
            await child.loadParent();

            if (!child.parent) {
                return false;
            }

            return (child.parent._id || child.parent).toString() === (document._id || document).toString();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    public async isParentOfDeep(document: HierarchyDocument<T>, child: HierarchyDocument<T>): Promise<boolean> {
        try {
            await child.loadParent();

            if (!child.parent) {
                return false;
            }

            const isParent = await this.isParentOf(document, child);

            if (isParent) {
                return true;
            }

            return this.isParentOfDeep(document, child.parent);
        } catch (e) {
            return Promise.reject(e);
        }
    }
}
