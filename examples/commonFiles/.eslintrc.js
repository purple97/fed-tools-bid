module.exports = {
    env: {
        browser: true,
        commonjs: true,
        node: true,
        es6: true
    },
    parser: 'babel-eslint',
    extends: ['eslint:recommended', 'plugin:react/recommended'],
    plugins: ['react'],
    parserOptions: {
        ecmaVersion: 2015,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    globals: {
        BrBridge: true,
        BrSPM: true,
        _: true,
        $: true,
        vue: true,
        gdt: true,
        wx: true
    },
    rules: {
        'array-bracket-spacing': ['error'],
        'arrow-body-style': ['error', 'as-needed'],
        'arrow-spacing': ['error'],
        'block-spacing': ['error'],
        'brace-style': ['error'],
        camelcase: ['warn'],
        'capitalized-comments': ['off'],
        'comma-dangle': ['error'],
        'comma-spacing': ['error'],
        'comma-style': ['error'],
        'computed-property-spacing': ['error'],
        curly: ['off'],
        'dot-location': ['error', 'property'],
        'dot-notation': ['off'],
        'eol-last': ['off'],
        'func-call-spacing': ['error'],
        'func-name-matching': ['error'],
        'generator-star-spacing': ['off'],
        indent: [
            'error',
            4,
            {
                SwitchCase: 1
            }
        ],
        'jsx-quotes': ['error', 'prefer-single'],
        'key-spacing': ['error'],
        'keyword-spacing': ['error'],
        'linebreak-style': ['error'],
        'lines-around-comment': [
            'off',
            {
                beforeLineComment: true
            }
        ],
        'lines-around-directive': ['error'],
        'new-cap': ['off'],
        'newline-after-var': ['off'],
        'newline-before-return': ['off'],
        'new-parens': ['error'],
        'no-cond-assign': ['off'],
        'no-console': ['off'],
        'no-delete-var': ['off'],
        'no-extra-bind': ['error'],
        'no-extra-parens': [
            'error',
            'all',
            {
                returnAssign: false,
                ignoreJSX: 'multi-line',
                enforceForArrowConditionals: false,
                nestedBinaryExpressions: false
            }
        ],
        'no-floating-decimal': ['error'],
        'no-lonely-if': ['error'],
        'no-multiple-empty-lines': [
            'error',
            {
                max: 1,
                maxBOF: 0,
                maxEOF: 0
            }
        ],
        'no-multi-spaces': ['error'],
        'no-redeclare': ['error'],
        'no-undef-init': ['error'],
        'no-useless-computed-key': ['error'],
        'no-useless-rename': ['error'],
        'no-useless-return': ['error'],
        'no-var': ['warn'],
        'no-whitespace-before-property': ['error'],

        'object-curly-newline': ['off'],
        'object-curly-spacing': ['off'],
        'object-shorthand': ['off'],
        'operator-assignment': ['warn'],
        'one-var': ['off'],
        'one-var-declaration-per-line': ['error'],
        'padded-blocks': ['off', 'never'],
        'prefer-arrow-callback': ['off'],
        'prefer-spread': ['off'],
        'prefer-template': ['off'],
        quotes: ['error', 'single'],
        'quote-props': ['off', 'as-needed'],
        'react/prop-types': ['off'],
        'react/jsx-boolean-value': ['off'],
        'react/jsx-curly-spacing': ['error'],
        'react/jsx-space-before-closing': ['off', 'never'],
        'react/jsx-indent': ['off'],
        'react/jsx-indent-props': ['off'],
        'react/jsx-filename-extension': ['error', { extensions: ['.ts', '.tsx', '.js', '.jsx'] }],
        'react/jsx-one-expression-per-line': ['off'],
        'react/jsx-wrap-multilines': ['off'],
        'react/no-access-state-in-setstate': ['off'],
        'react/no-array-index-key': ['off'],
        'jsx-a11y/alt-text': ['off'],
        'jsx-a11y/click-events-have-key-events': ['off'],
        'jsx-a11y/no-static-element-interactions': ['off'],
        'jsx-a11y/anchor-is-valid': ['off'],
        'jsx-a11y/label-has-for': ['off'],
        'jsx-a11y/label-has-associated-control': ['off'],
        'react/jsx-wrap-multilines': ['off'],
        'rest-spread-spacing': ['error'],
        semi: ['off', 'never'],
        'space-before-blocks': ['error'],
        'space-before-function-paren': ['off', 'never'],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': ['error'],
        'space-unary-ops': [
            'error',
            {
                words: true,
                nonwords: false
            }
        ],
        'template-curly-spacing': ['error'],
        'yield-star-spacing': ['error'],
        'import/order': ['off'],
        'import/no-cycle': ['off'],
        'import/no-webpack-loader-syntax': ['off'],
        'import/newline-after-import': ['off'],
        yoda: ['error']
    }
};
