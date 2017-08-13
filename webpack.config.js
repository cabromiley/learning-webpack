let webpack = require('webpack');
let path = require('path');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let glob = require('glob');
let PurifyCSSPlugin = require('purifycss-webpack');
let CleanWebpackPlugin = require('clean-webpack-plugin');
let ManifestPlugin = require('webpack-manifest-plugin');

// make production flag
let inProduction = (process.env.NODE_ENV === 'production');

module.exports = {
    // where to look for code {'output name' : [ 'source files' ]}
    entry: {
        app:  [
            './src/main.js',
            './src/main.scss'
        ]
    },
    // details on where to dump the outputted files.
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[chunkhash].js'
    },
    // what to do with each file.
    module: {
        rules: [
            // js rules
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: [ 
                    'babel-loader',
                    {
                       loader:  'eslint-loader',
                       options: {
                            quiet: true,
                            failOnWarning: false,
                            failOnError: false,
                            outputReport: {
                                filePath: 'checkstyle.xml',
                                formatter: require('eslint/lib/formatters/checkstyle')
                            }
                       }
                    }
                ]
            },
            // sass rules
            {
                test: /\.s[ac]ss$/,
                use: ExtractTextPlugin.extract({
                    // use: ['css-loader', 'sass-loader'],
                    use : [
                        {
                            loader: 'css-loader',
                            options: {
                                url: false
                            }
                        },

                        'sass-loader'
                    ],
                    fallback: 'style-loader'
                }) 
            },
            // fonts
            {
                test: /\.(eot|ttf|woff|woff2)$/,
                use: 'file-loader'
            },
            // Load in files
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                loaders: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: 'images/[name].[hash].[ext]'
                        }
                    },

                    'img-loader'
                ],
            }
        ]
    },
    // third party code to do extra stuff to the generated files
    plugins: [
        // extract css into its own file
        new ExtractTextPlugin('[name].[chunkhash].css'),
        // add minification
        new webpack.LoaderOptionsPlugin({
          minimize: inProduction,
          debug: false,
          options: {
            context: __dirname
          }
        }),
        // tree shake css removing unused selectors
        new PurifyCSSPlugin({
          paths: glob.sync(path.join(__dirname, '/*.html')),
          minimize: inProduction
        }),
        // remove old versions of build files
        new CleanWebpackPlugin([
          'dist'
        ], {
          root:     __dirname,
          exclude:  [],
          verbose:  false,
          dry:      false
        }),

        // generate manifest
        function () {
            this.plugin('done', stats => {
                require('fs').writeFileSync(
                    path.join(__dirname, 'dist/manifest.json'),
                    JSON.stringify(stats.toJson().assetsByChunkName)
                );
            });
        },
        //  make manifest
        new ManifestPlugin()

    ]
};


// check if in production mode.
if (inProduction) {
    module.exports.plugins.push(
        new webpack.optimize.UglifyJsPlugin(), // uglyfy js
    );
}