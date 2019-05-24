module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "mocha": true,
        "node": true,
        "jquery": true
    },
    "globals": {
      "$": true,
        "moment": true,
        "Mustache": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "indent": [
            "warn",
            4
        ],
        "linebreak-style": [
            "warn",
            "unix"
        ],
        "quotes": [
            "warn",
            "single"
        ],
        // "semi": "info",
        "mocha/no-exclusive-tests": "warn",
        "no-console": "off"
    },
    "plugins": [
        "mocha",
        "node"
    ]
};