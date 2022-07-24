/**
 * https://jestjs.io/docs/next/code-transformation
 */

const {buildSync} = require('esbuild');
const {appendFileSync, readFileSync} = require('fs');
const {randomUUID} = require('crypto');
const {join, resolve} = require('path');

interface TransformerConfig {
    readonly outDir: string,
    readonly esbuildLogFilename: string,
    readonly verbose: boolean,
    readonly useCache: boolean,
    readonly esbuildConfig: any
}

const defaultConfig: TransformerConfig = {
    esbuildLogFilename: 'esbuild.log',
    outDir: './dist/ng-esbuild/',
    useCache: true,
    verbose: false,
    esbuildConfig: {}
}

interface TransformOptions {
    supportsDynamicImport: boolean;
    supportsExportNamespaceFrom: boolean;
    supportsStaticESM: boolean;
    supportsTopLevelAwait: boolean;
    instrument: boolean;
    cacheFS: Map<string, string>;
    configString: string;
    transformerConfig: TransformerConfig;
}

type TransformedSource = {
    code: string;
    map?: string | null;
};

module.exports = {
    process(sourceText: string, sourcePath: string, userOptions: TransformOptions): TransformedSource {
        const options = {
            ...defaultConfig,
            ...(userOptions && userOptions.transformerConfig ? userOptions.transformerConfig : {})
        };

        printVerbose(options, 'Processing file', sourcePath);

        const fileName = randomUUID().toString() + '.js';
        const outFile = resolve(join(options.outDir, fileName));

        printVerbose(options, 'Processed file will be saved as', outFile);

        const buildOptions = {
            ...options.esbuildConfig,
            entryPoints: [sourcePath],
            format: 'iife',
            platform: 'node',
            bundle: true,
            outfile: outFile,
        };

        printVerbose(options, 'Build options', JSON.stringify(buildOptions));
        printVerbose(options, 'Build started');
        const buildResult = buildSync(buildOptions);
        printVerbose(options, 'Build completed');

        logIfNecessary(options, buildResult);

        printVerbose(
            options,
            'Esbuild result',
            `errors: ${buildResult.errors.length}`,
            `warnings: ${buildResult.warnings.length}`
        );

        const result = readFileSync(outFile).toString();

        return {
            code: result
        };
    }
};

function logIfNecessary(options: TransformerConfig, buildResult: unknown) {
    if (options.esbuildLogFilename) {
        const buildLogFile = resolve(join(options.outDir, options.esbuildLogFilename));
        const buildResultJson = JSON.stringify(buildResult, null, 2);
        const logText = `${new Date().toISOString()}\n${buildResultJson}\n`;
        appendFileSync(buildLogFile, logText);

        printVerbose(options, 'Build log saved in file', buildLogFile);
    }
}

function printVerbose(options: TransformerConfig, ...msg: Array<string>): void {
    if (options.verbose) {
        console.log(new Date().toISOString(), '[ng-esbuild]', ...msg);
    }
}
