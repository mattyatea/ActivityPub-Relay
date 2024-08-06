import { Linter } from "eslint";

const config = {
	env: {
		browser: true,
		es2021: true,
		node: true,
	},
	extends: [
		"eslint:recommended",
		"plugin:react/recommended",
		"plugin:@typescript-eslint/recommended",
		"airbnb-base",
		"plugin:prettier/recommended",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 12,
		sourceType: "module",
	},
	plugins: ["react", "@typescript-eslint", "prettier"],
	rules: {
		"prettier/prettier": "error",
		"react/react-in-jsx-scope": "off",
		"no-console": "warn",
		"no-unused-vars": "warn",
		"@typescript-eslint/no-unused-vars": ["warn"],
		"import/extensions": [
			"error",
			"ignorePackages",
			{
				ts: "never",
				tsx: "never",
				js: "never",
				jsx: "never",
			},
		],
	},
	settings: {
		"import/resolver": {
			node: {
				extensions: [".js", ".jsx", ".ts", ".tsx"],
			},
		},
		react: {
			version: "detect",
		},
	},
};

export default config;
