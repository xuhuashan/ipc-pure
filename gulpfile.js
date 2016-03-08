var gulp = require('gulp'),
    less = require('gulp-less'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    watch = require('gulp-watch');

gulp.task('default', function () {
    // 将你的默认的任务代码放在这
});

// 编译Less
gulp.task('less', function () {
    return gulp.src('css/*.less')
        .pipe(less())
        .pipe(gulp.dest('dist/css'));
});

// 压缩js
gulp.task('js', function () {
    return gulp.src('js/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});