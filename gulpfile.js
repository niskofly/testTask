var gulp = require("gulp"),
    plumber = require("gulp-plumber"),
    jade = require("gulp-jade"), // compile jade
    sass = require("gulp-sass"), // compile sass
    sourcemaps = require("gulp-sourcemaps"),
    prefix = require("gulp-autoprefixer"),
    rename = require("gulp-rename"), // compile js
    uglify = require("gulp-uglify-es").default,
    webpack = require("webpack"),
    webpackStream = require("webpack-stream"),
    dirSync = require("gulp-directory-sync"), // synchronization
    browserSync = require("browser-sync").create(),
    rimraf = require("rimraf"), // building
    csso = require("gulp-csso"),
    purify = require("gulp-purifycss");

var assetsDir = "src/";
var outputDir = "app/";
var buildDir = "build/";

gulp.task("browser-sync", function() {
    browserSync.init({
        port: 1337,
        server: {
            baseDir: outputDir
        }
    });
});

//---------------------------------------------------- Compiling
gulp.task("jade", function() {
    gulp.src([
        assetsDir + "jade/**/*.jade",
        "!" + assetsDir + "jade/_*.jade",
        "!" + assetsDir + "jade/tpl/_*.jade",
        "!" + assetsDir + "jade/layout/_*.jade",
        "!" + assetsDir + "jade/common/_*.jade"
    ])
        .pipe(plumber())
        .pipe(jade({ pretty: true }))
        .pipe(gulp.dest(outputDir))
        .pipe(browserSync.stream());
});

gulp.task("sass", function() {
    gulp.src([
        assetsDir + "sass/**/*.sass",
        "!" + assetsDir + "sass/**/_*.sass",
        assetsDir + "sass/**/*.scss",
        "!" + assetsDir + "sass/**/_*.scss"
    ])
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(prefix("last 3 versions"))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(outputDir + "css/"))
        .pipe(browserSync.stream());
});

gulp.task("js", function() {
    return gulp
        .src(assetsDir + "js/app.js")
        .pipe(
            webpackStream({
                output: {
                    filename: "app.js"
                },
                module: {
                    rules: [
                        {
                            test: /\.vue$/,
                            loader: "vue-loader"
                        },
                        {
                            test: /\.(js)$/,
                            exclude: /(node_modules)/,
                            loader: "babel-loader",
                            query: {
                                presets: ["env"]
                            }
                        }
                    ]
                },
                resolve: {
                    alias: {
                        vue$: "vue/dist/vue.common.js"
                    }
                }
            })
        )
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest(outputDir + "js/"))
        .pipe(browserSync.stream());
});

gulp.task("watch", function() {
    gulp.watch(assetsDir + "jade/**/*.jade", ["jade"]);
    gulp.watch(assetsDir + "sass/**/*.scss", ["sass"]);
    gulp.watch(assetsDir + "sass/**/*.sass", ["sass"]);
    gulp.watch(assetsDir + "js/**/*.js", ["js"]);
    gulp.watch(assetsDir + "js/**/*.vue", ["js"]);
    gulp.watch(assetsDir + "img/**/*", ["imageSync"]);
    gulp.watch(assetsDir + "fonts/**/*", ["fontsSync"]);
});
//---------------------------------------------------- Compiling ###

//------------------------------------------------- Synchronization
gulp.task("imageSync", function() {
    return gulp
        .src("")
        .pipe(plumber())
        .pipe(
            dirSync(assetsDir + "img/", outputDir + "img/", {
                printSummary: true
            })
        )
        .pipe(browserSync.stream());
});

gulp.task("fontsSync", function() {
    return gulp
        .src("")
        .pipe(plumber())
        .pipe(
            dirSync(assetsDir + "fonts/", outputDir + "fonts/", {
                printSummary: true
            })
        )
        .pipe(browserSync.stream());
});
//------------------------------------------------- Synchronization ###

//---------------------------------------------------- Building
gulp.task("cleanBuildDir", function(cb) {
    rimraf(buildDir, cb);
});

gulp.task("copyHtml", function() {
    return gulp.src(outputDir + "**/*.html").pipe(gulp.dest(buildDir));
});

gulp.task("buildCss", function() {
    return gulp
        .src(outputDir + "css/**/*")
        .pipe(purify([outputDir + "js/**/*", outputDir + "**/*.html"]))
        .pipe(csso())
        .pipe(gulp.dest(buildDir + "css/"));
});

gulp.task("buildJs", function() {
    return gulp
        .src(assetsDir + "js/app.js")
        .pipe(
            webpackStream({
                output: {
                    filename: "app.js"
                },
                module: {
                    rules: [
                        {
                            test: /\.(js)$/,
                            exclude: /(node_modules)/,
                            loader: "babel-loader",
                            query: {
                                presets: ["env"]
                            }
                        }
                    ]
                }
            })
        )
        .pipe(gulp.dest(buildDir + "js/"))
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest(buildDir + "js/"));
});

gulp.task("copyFonts", function() {
    return gulp
        .src(outputDir + "/fonts/**/*")
        .pipe(gulp.dest(buildDir + "/fonts/"));
});

gulp.task("copyImg", function() {
    return gulp
        .src([outputDir + "img/**/*", "!" + outputDir + "img/sprite/*.svg"])
        .pipe(gulp.dest(buildDir + "img/"));
});

gulp.task("copySVG", function() {
    return gulp
        .src(outputDir + "img/sprite/sprite.svg")
        .pipe(gulp.dest(buildDir + "img/sprite/"));
});

gulp.task("build", ["cleanBuildDir"], function() {
    gulp.start(
        "copySVG",
        "copyImg",
        "copyHtml",
        "buildJs",
        "buildCss",
        "copyFonts"
    );
});

//---------------------------------------------------- Building ###

//-------------------------------------------- SVG sprite
var svgSprite = require("gulp-svg-sprite"),
    svgmin = require("gulp-svgmin"),
    cheerio = require("gulp-cheerio"),
    replace = require("gulp-replace");

gulp.task("svgRun", function() {
    return (
        gulp
            .src(assetsDir + "img/icons/*.svg")
            // minify svg
            .pipe(
                svgmin({
                    js2svg: {
                        pretty: true
                    }
                })
            )
            // remove all fill and style declarations in out shapes
            .pipe(
                cheerio({
                    run: function($) {
                        $("[fill]").removeAttr("fill");
                        $("[stroke]").removeAttr("stroke");
                        $("[style]").removeAttr("style");
                    },
                    parserOptions: { xmlMode: true }
                })
            )
            // cheerio plugin create unnecessary string '&gt;', so replace it.
            .pipe(replace("&gt;", ">"))
            // build svg sprite
            .pipe(
                svgSprite({
                    mode: {
                        symbol: {
                            sprite: "../sprite.svg",
                            render: {
                                scss: {
                                    dest: "../../../sass/base/_sprite.scss",
                                    template:
                                        assetsDir +
                                        "sass/helpers/_sprite_template.scss"
                                }
                            },
                            example: true
                        }
                    }
                })
            )
            .pipe(gulp.dest(assetsDir + "img/sprite/"))
    );
});
//-------------------------------------------- SVG sprite ###

gulp.task("default", [
    "jade",
    "sass",
    "js",
    "imageSync",
    "fontsSync",
    "watch",
    "browser-sync"
]);
