module.exports = {
    port: process.env.port ?? 3032,
    internalPort: process.env.internalPort ?? 3033,
    mongoUri: process.env.mongoUri ?? "mongodb://docker:27017/default",
    userService: process.env.userService ?? "http://localhost:3034",
    paymentService: process.env.paymentService ?? "http://localhost:3035",
    facebook: {
        clientToken: 'e0174a24d525df9bbbe9fc2ad336f190',
        appId: '833579180446956',
        appSecret: 'c1b4fbe7cf13fa9edc94d5251c78a271'
    },
    google: {
        clientId: '1040087815510-f3d250d960n4iaqn9vaent4ivjvs8fk9.apps.googleusercontent.com'
    },
    sentry: {
        dsn: process.env.sentryDsn ?? "https://09b30704c4fa4441aacba051b4c6627c@sentry.codebuild.hu/2",
        release: process.env.sentryRelease ?? 'no-release-name-while-develop',
        environment: process.env.sentryEnvironment ?? 'development'
    },
    redis: {
        host: process.env.redisHost ?? 'docker',
        port: process.env.redisPort ?? 6379,
    },
    settings: {
        skuPrefix: process.env.settingsSkuPrefix ?? "development",
        supportedCurrencies: process.env.settingsSupportedCurrencies ?? ["EUR", "USD", "HUF"],
        exchangeRateUpdateInterval: process.env.settingsExchangeRateUpdateInterval ?? 1000 * 60,
        allowedRegistrationTypes: process.env.settingsAllowedRegistrationTypes ?? ["password"],
        cartKeepAlive: process.env.settingsCartKeepAlive ?? (1000 * 60 * 60 * 24) * 2
    }
};
