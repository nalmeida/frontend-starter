/*=====================================================================*/
/*                  Gulp with Tailwind Utility framework               */
/*=====================================================================*/

/*
	Usage ::
	=======================================================================

	1. npm install //To install all dev dependencies of package

	2. npm run dev //To start development and server for live preview

	3. npm run prod //To generate minifed files for live server
*/

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
//Note : Webp still not supported in majpr browsers including forefox
//const webp = require('gulp-webp'); //For converting images to WebP format
//const replace = require('gulp-replace'); //For Replacing img formats to webp in html
const del = require('del'); //For Cleaning prod/dev for fresh export
const logSymbols = require('log-symbols'); //For Symbolic Console logs :) :P

class TailwindExtractor {
  static extract(content) {
	return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
  }
}

//Load Previews on Browser on dev
task('livepreview', (done) => {
	browserSync.init({
		server: {
			baseDir: options.paths.dev.base
		},
		port: 1234
	});
	done();
});

//Reload functions which triggers browser reload
function previewReload(done){
	console.log("\n\t" + logSymbols.info,"Reloading Preview.\n");
	browserSync.reload();
	done();
}

task('dev-html', () => {
	return src([options.paths.src.base + '/robots.txt', options.paths.src.base + '/**/*.html'])
		   //Note : Webp still not supported in majpr browsers including forefox
		   //.pipe(replace('.jpg', '.webp'))
		   //.pipe(replace('.png', '.webp'))
		   //.pipe(replace('.jpeg','.webp'))
		   .pipe(dest(options.paths.dev.base));
});

task('prod-html', () => {
	return src([options.paths.src.base + '/robots.txt', options.paths.src.base + '/**/*.html'])
		   //Note : Webp still not supported in majpr browsers including forefox
		   //.pipe(replace('.jpg', '.webp'))
		   //.pipe(replace('.png', '.webp'))
		   //.pipe(replace('.jpeg','.webp'))
		   .pipe(dest(options.paths.prod.base));
});

//Compiling styles
task('dev-styles', ()=> {
	var tailwindcss = require('tailwindcss');
	return src(options.paths.src.css + '/**/*')
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([
			tailwindcss(options.config.tailwindjs),
			require('autoprefixer'),
		]))
		.pipe(concat({ path: 'style.css'}))
		.pipe(dest(options.paths.dev.css));
});

//Compiling styles
task('prod-styles', ()=> {
	return src(options.paths.dev.css + '/**/*')
		.pipe(purgecss({
			content: ["src/robots.txt", "src/**/*.html","src/**/.*js"],
			extractors: [{
				extractor: TailwindExtractor,
				extensions: ['html']
			}]
		}))
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(dest(options.paths.prod.css));
});

//merging all script files to a single file

task('dev-scripts' ,()=> {
	return src([
			options.paths.src.js + '/vendor/**/*.js',
			options.paths.src.js + '/**/*.js'
		])
		.pipe(concat({ path: 'scripts.js'}))
		.pipe(dest(options.paths.dev.js));
});

//merging all script files to a single file
task('prod-scripts' ,()=> {
	return src([
			options.paths.src.js + '/vendor/**/*.js',
			options.paths.src.js + '/**/*.js'
		])
		.pipe(concat({ path: 'scripts.js'}))
		.pipe(uglify())
		.pipe(dest(options.paths.prod.js));
});

task('dev-imgs', (done) =>{
	src(options.paths.src.img + '/**/*')
	//Note : Webp still not supported in majpr browsers including forefox
	//.pipe(webp({ quality: 100 }))
	.pipe(dest(options.paths.dev.img));
	done();
});

task('prod-imgs', (done) =>{
	src(options.paths.src.img + '/**/*')
	//Note : Webp still not supported in majpr browsers including forefox
	//.pipe(webp({ quality: 100 }))
	.pipe(imagemin())
	.pipe(dest(options.paths.prod.img));
	done();
});


//Watch files for changes
task('watch-changes', (done) => {

	//Watching HTML Files edits
	watch(options.config.tailwindjs,series('dev-styles',previewReload));

	//Watching HTML Files edits
	watch(options.paths.src.base+'/**/*.html',series('dev-styles','dev-html',previewReload));

	//Watching css Files edits
	watch(options.paths.src.css+'/**/*',series('dev-styles',previewReload));

	//Watching JS Files edits
	watch(options.paths.src.js+'/**/*.js',series('dev-scripts',previewReload));

	//Watching Img Files updates
	watch(options.paths.src.img+'/**/*',series('dev-imgs',previewReload));

	console.log("\n\t" + logSymbols.info,"Watching for Changes made to files.\n");

	done();
});

//Cleaning dev folder for fresh start
task('clean:dev', ()=> {
	console.log("\n\t" + logSymbols.info,"Cleaning dev folder for fresh start.\n");
	return del(['dev']);
});

//Cleaning prod folder for fresh start
task('clean:prod', ()=> {
	console.log("\n\t" + logSymbols.info,"Cleaning prod folder for fresh start.\n");
	return del(['prod']);
});

//series of tasks to run on dev command
task('development', series('clean:dev','dev-html','dev-styles','dev-scripts','dev-imgs',(done)=>{
	console.log("\n\t" + logSymbols.info,"npm run dev is complete. Files are located at ./dev\n");
	done();
}));

task('optimizedProd', series('clean:prod','prod-html','dev-styles','prod-styles','prod-scripts','prod-imgs',(done)=>{
	console.log("\n\t" + logSymbols.info,"npm run prod is complete. Files are located at ./prod\n");
	done();
}));


exports.default = series('development','livepreview','watch-changes');
exports.build = series('optimizedProd');