var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var babel = require('gulp-babel');

function task_js() {
  return gulp.src('mionendas.js')
  .pipe(babel({presets: ['@babel/env']}))
  .on('error', function(err) {
    console.error('[Compilation Error]');
    console.error(err.message + '\n');
    console.error(err.codeFrame);
    this.emit('end');
  })
  .pipe(uglify())
  .pipe(rename('index.js'))
  .pipe(gulp.dest('./'))
};

function task_watch() {
  gulp.watch('rhaetia.js', gulp.parallel(task_js));
};

gulp.task('default', gulp.parallel(task_js, task_watch));
