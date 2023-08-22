module.exports = {
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(axios)/)', // add the name of the module that needs to be transformed
    ],
};
