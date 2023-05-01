module.exports = {
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: ["./tsconfig.json"],
    },
    rules: {
        indent: ["warn", 4, { SwitchCase: 1 }],
        semi: ["error", "always"],
        quotes: [
            "error",
            "double",
            {
                avoidEscape: true,
            },
        ],
        eqeqeq: ["error", "always"],
        "no-var": "error",
        "@typescript-eslint/typedef": [
            "error",
            {
                arrayDestructuring: true,
                arrowParameter: true,
                memberVariableDeclaration: true,
                objectDestructuring: true,
                parameter: true,
                propertyDeclaration: true,
                variableDeclaration: false,
                variableDeclarationIgnoreFunction: true,
            },
        ],
        "@typescript-eslint/explicit-function-return-type": "error",
    },
};
