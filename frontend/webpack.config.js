const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const tmpdir = require('os').tmpdir
const join = require('path').join


module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, '..', 'public')
    },
    performance : {
        hints : false
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: path.resolve(__dirname, '..', 'public', 'index.html'),
            template: 'src/index.html'
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: join(tmpdir(), 'report.html'),
            openAnalyzer: false
        })
    ],
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', {
                    loader: "sass-loader",
                    options: {
                        sassOptions: {
                            includePaths: ["node_modules/", "src/"]
                        }
                    }
                }]
            }
        ]
    }
};