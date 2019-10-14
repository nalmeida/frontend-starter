const { src, dest, task, watch, series } = require('gulp');
const options = require('./package.json').options; //Options : paths and other options from package.json
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass'); //For Compiling SASS files
const concat = require('gulp-concat'); //For Concatinating js,css files
const postcss = require('gulp-postcss'); //For Compiling tailwind utilities with tailwind config
const uglify = require('gulp-uglify');//To Minify JS files
const imagemin = require('gulp-imagemin'); //To Optimize Images
const purgecss = require('gulp-purgecss'); //To Remove Unsued CSS
const cleanCSS = require('gulp-clean-css');//To Minify CSS files
const del = require('del'); //For Cleaning prod/dev for fresh export
const tailwindcss = require('tailwindcss');
const sitemap = require('gulp-sitemap');
const include = require('gulp-file-include');

// const rename = require("gulp-rename");

const devFolder = options.paths.dev.folder;
const prodFolder = options.paths.prod.folder;
const includeDevObj = {
	prefix: '@@',
	basepath: '@file',
	context: {
		url: options.paths.dev.url,
		img: options.paths.dev.imgUrl
	}
};
const includeProdObj = {
	prefix: '@@',
	basepath: '@file',
	context: {
		url: options.paths.prod.url,
		img: options.paths.prod.imgUrl
	}
};

class TailwindExtractor {
	static extract(content) {
		return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
	}
}

//Load Previews on Browser on dev
task('livepreview', (done) => {
	browserSync.init({
		server: {
			baseDir: devFolder
		},
		open: false,
		port: 1234
	});
	done();
});

//Reload functions which triggers browser reload
function previewReload(done){
	console.log('\nℹ️  Reloading Preview.\n');
	browserSync.reload();
	done();
}

task('dev-sitemap', () => {
	return src([
		'./src/**/*.html',
		'!./src/include/**/*'
		], {
			read: false
		})
		.pipe(sitemap({
			siteUrl: includeDevObj.context.url
		}))
		.pipe(dest(devFolder));
});

task('prod-sitemap', () => {
	return src([
		'./src/**/*.html',
		'!./src/include/**/*'
		], {
			read: false
		})
		.pipe(sitemap({
			siteUrl: 'http:' + includeProdObj.context.url
		}))
		.pipe(dest(prodFolder));
});``

task('dev-html', () => {
	return src([
		'./src/robots.txt',
		'./src/**/*.html',
		'!./src/include/**/*'
	])
	.pipe(include(includeDevObj))
	.pipe(dest(devFolder));
});

task('prod-html', () => {
	return src([
		'./src/robots.txt',
		'./src/**/*.html',
		'!./src/include/**/*'
	])
	.pipe(include(includeProdObj))
	.pipe(dest(prodFolder));
});

//Compiling styles
task('dev-styles', ()=> {
	return src('./src/assets/css/**/*')
		.pipe(include(includeDevObj))
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([
			tailwindcss(options.config.tailwindjs),
			require('autoprefixer'),
		]))
		.pipe(concat({ path: 'style.css'}))
		.pipe(dest(devFolder + '/assets/css/'));
});

//Compiling styles
task('prod-styles', ()=> {
	return src('./src/assets/css/**/*')
		.pipe(include(includeProdObj))
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([
			tailwindcss(options.config.tailwindjs),
			require('autoprefixer'),
		]))
		.pipe(concat({ path: 'style.css'}))
		.pipe(purgecss({
			content: ['src/**/*.html', 'src/**/.*js'],
			extractors: [{
				extractor: TailwindExtractor,
				extensions: ['html']
			}]
		}))
		.pipe(cleanCSS({compatibility: 'ie8'}))
		// .pipe(rename({ suffix: '.min' }))
		.pipe(dest(prodFolder + '/assets/css'));
});

//merging all script files to a single file
task('dev-scripts' ,()=> {
	return src([
			'./src/assets/js/vendor/**/*.js',
			'./src/assets/js/**/*.js'
		])
		.pipe(include(includeDevObj))
		.pipe(concat({ path: 'scripts.js'}))
		.pipe(dest(devFolder + '/assets/js'));
});

//merging all script files to a single file
task('prod-scripts' ,()=> {
	return src([
		'./src/assets/js/vendor/**/*.js',
		'./src/assets/js/**/*.js'
	])
		.pipe(include(includeProdObj))
		.pipe(concat({ path: 'scripts.js'}))
		.pipe(uglify())
		// .pipe(rename({ suffix: '.min' }))
		.pipe(dest(prodFolder + '/assets/js'));
});

task('dev-imgs', (done) =>{
	src('./src/assets/img/**/*')
	.pipe(dest(devFolder + '/assets/img'));
	done();
});

task('prod-imgs', (done) =>{
	src('./src/assets/img/**/*')
	.pipe(imagemin())
	.pipe(dest(prodFolder + '/assets/img'));
	done();
});


//Watch files for changes
task('watch-changes', (done) => {

	//Watching HTML Files edits
	watch(options.config.tailwindjs, series('dev-styles', previewReload));

	//Watching HTML Files edits
	watch('./src/**/*.html', series('dev-styles','dev-html', previewReload));

	//Watching css Files edits
	watch('./src/assets/css/**/*', series('dev-styles', previewReload));

	//Watching JS Files edits
	watch('./src/assets/js/**/*.js', series('dev-scripts', previewReload));

	//Watching Img Files updates
	watch('./src/assets/img/**/*', series('dev-imgs', previewReload));

	console.log('\nℹ️  Watching for Changes made to files.\n');

	done();
});

//Cleaning dev folder for fresh start
task('clean:dev', ()=> {
	console.log('\nℹ️  Cleaning dev folder for fresh start.\n ');
	return del(['dev']);
});

//Cleaning prod folder for fresh start
task('clean:prod', ()=> {
	console.log('\nℹ️  Cleaning prod folder for fresh start.\n ');
	return del(['prod']);
});

//series of tasks to run on dev command
task('development', series('clean:dev', 'dev-sitemap', 'dev-html','dev-styles','dev-scripts','dev-imgs',(done)=>{
	console.log('\nℹ️  npm run dev is complete. Files are located at ./dev\n ');
	done();
}));

task('optimizedProd', series('clean:prod', 'prod-sitemap', 'prod-html','prod-styles','prod-scripts','prod-imgs',(done)=>{
	console.log('\nℹ️  npm run prod is complete. Files are located at ./prod\n ');
	done();
}));

exports.default = series('development', 'livepreview', 'watch-changes');
exports.build = series('optimizedProd');