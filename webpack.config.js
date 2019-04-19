    const webpack = require('webpack');
const path = require('path');

/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function(opts) {
        'use strict';

        var PROJECT_PATH = opts.PROJECT_PATH;
        var CMS_VERSION = opts.CMS_VERSION;
        var debug = opts.debug;

        if (!debug) {
            process.env.NODE_ENV = 'production';
        }

        var baseConfig = {

            mode: 'production',
            performance: {
                hints: false,
                maxEntrypointSize: 270000,
                maxAssetSize: 270000
            },
            devtool: false,
            watch: !!opts.watch,
            entry: {
                // CMS frontend
                toolbar: PROJECT_PATH.js + '/toolbar.js',
                // CMS admin
                'admin.base': PROJECT_PATH.js + '/admin.base.js',
                'admin.pagetree': PROJECT_PATH.js + '/admin.pagetree.js',
                'admin.changeform': PROJECT_PATH.js + '/admin.changeform.js',
                // CMS widgets
                // they will load the on-demand bundle called admin.widget
                'forms.pageselectwidget': PROJECT_PATH.js + '/widgets/forms.pageselectwidget.js',
                'forms.slugwidget': PROJECT_PATH.js + '/widgets/forms.slugwidget.js',
                'forms.pagesmartlinkwidget': PROJECT_PATH.js + '/widgets/forms.pagesmartlinkwidget.js',
                'forms.apphookselect': PROJECT_PATH.js + '/widgets/forms.apphookselect.js'
            },
            output: {
                path: PROJECT_PATH.js + '/dist/' + CMS_VERSION + '/',
                filename: 'bundle.[name].min.js',
                chunkFilename: 'bundle.[name].min.js',
                jsonpFunction: 'cmsWebpackJsonp'
            },

            module: {
                rules: [
                    // must be first
                    {
                        test: /\.js$/,
                        use: [{
                            loader: 'babel-loader',
                            options: {
                                retainLines: true,
                            }
                        }],
                        exclude: /(node_modules|libs|addons\/jquery.*)/,
                        include: path.join(__dirname, 'cms')
                    },
                    {
                        test: /(modules\/jquery|libs\/pep|select2\/select2)/,
                        use: [{
                            loader: 'imports-loader',
                            options: {
                                jQuery: 'jquery'
                            }
                        }]
                    },
                    {
                        test: /class.min.js/,
                        use: [{
                            loader: 'exports-loader',
                            options: {
                                Class: true
                            }
                        }]
                    },
                    {
                        test: /.html$/,
                        use: [{
                            loader: 'raw-loader'
                        }]
                    }
                ]
            },

            stats: {
                // Examine all modules
                maxModules: Infinity,
                // Display bailout reasons
                optimizationBailout: true
            },

            plugins: [
                new webpack.optimize.ModuleConcatenationPlugin(),
            ],
            optimization: {

                splitChunks: {


                    cacheGroups: {
                        commons: {
                            name: 'admin.base',
                            chunks: 'all',
                            minChunks: 2,
                            enforce: true,

                            reuseExistingChunk: true,

                        }
                    }

                    minimize: true,

                },

                resolve: {
                    alias: {
                        jquery: PROJECT_PATH.js + '/libs/jquery.min.js',
                        classjs: PROJECT_PATH.js + '/libs/class.min.js',
                        jstree: PROJECT_PATH.js + '/libs/jstree/jstree.min.js'
                    }
                },

                stats: 'verbose'
            };

            if (debug) {
                baseConfig.devtool = 'cheap-module-eval-source-map';
                baseConfig.plugins = baseConfig.plugins.concat([
                    new webpack.NoEmitOnErrorsPlugin(),

                    new webpack.EnvironmentPlugin({

                        __DEV__: 'true',
                        __CMS_VERSION__: JSON.stringify(CMS_VERSION)
                    }),
                ]);
            } else {
                baseConfig.plugins = baseConfig.plugins.concat([
                    new webpack.EnvironmentPlugin({

                        __DEV__: 'false',
                        __CMS_VERSION__: JSON.stringify(CMS_VERSION)
                    }),

                    baseConfig.minimizer = baseConfig.minimizer.concat([
                        new TerserPlugin({
                            terserOptions: {
                                hints: false,
                                ecma: 6,
                                compress: true,
                                output: {
                                    comments: false,
                                    beautify: false
                                }
                            },

                            chunkFilter: (chunk) => {
                                // Exclude uglification for the `vendor` chunk
                                if (chunk.name === 'toolbar_test' || chunk.name === 'admin.pagetree_test') {
                                    return false;

                                }
                                return true;
                            }
                        }),

                    }),

                ]);
            }

            return baseConfig;
        };