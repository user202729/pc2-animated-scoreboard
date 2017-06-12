const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const envify = require('envify');
const watchify = require('watchify');
const uglify = require('gulp-uglify');
const merge = require('merge-stream');
const debug = require('debug')('pc2:gulp');

gulp.task('default', []);

gulp.task('render-jsx', () => {
	let b = browserify({
		entries: 'jsx/index.jsx',
		debug: false
	})
		.transform('babelify', {
			presets: ['es2015', 'react']
		})
		.transform(envify, { global: true })
		.bundle()
		.pipe(source('index.js'))
		.pipe(buffer());
	if (process.env.NODE_ENV === 'production')
		b = b.pipe(uglify());
	return b.pipe(gulp.dest('public'));
});

gulp.task('watch', () => {
	function jsxWatch(entry, filename) {
		let a = browserify({
			entries: entry,
			debug: true,
			cache: {},
			packageCache: {},
			plugin: [watchify],
			transform: [['babelify', {
				presets: ['react', 'es2015']
			}]]
		});
		a.transform(envify, { global: true });
		a.on('update', () => {
			a.bundle()
				.pipe(source(filename))
				.pipe(buffer())
				.pipe(gulp.dest('public'));
		});
		a.bundle()
			.pipe(source(filename))
			.pipe(buffer())
			.pipe(gulp.dest('public'));
		a.on('log', debug);
		return a;
	}
	return jsxWatch('jsx/index.jsx', 'index.js');
});

gulp.task('copy-deps', () => {
	const bootstrap = merge(
		gulp.src('node_modules/bootstrap/dist/js/bootstrap.min.js')
			.pipe(gulp.dest('public')),
		gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css')
			.pipe(gulp.dest('public'))
	);
	const jquery = gulp.src('node_modules/jquery/dist/jquery.min.js')
		.pipe(gulp.dest('public'));
	const animate = gulp.src('node_modules/animate.css/animate.min.css')
		.pipe(gulp.dest('public'));
	return merge(bootstrap, jquery, animate);
});

