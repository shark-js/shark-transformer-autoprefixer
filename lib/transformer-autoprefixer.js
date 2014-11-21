'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const Transformer   = require('shark-transformer');
const autoprefixer  = require('autoprefixer-core');
const extend        = require('node.extend');
const co            = require('co');
const VError        = require('verror');

module.exports = Transformer.extend({
	renderAutoprefixer: function(css, prefixes) {
		try {
			return autoprefixer({
				browsers: prefixes
			}).process(css).css;
		}
		catch (error) {
			throw new VError(error, 'Autoprefixer error');
		}
	},

	transformTree: function *() {
		return this.tree.forEachDestSeries(co.wrap(function *(destPath, srcCollection, done) {
			try {
				yield this.transformTreeConcreteDest(destPath, srcCollection);
				done();
			}
			catch (error) {
				done(new VError(error, 'transformTree'));
			}
		}.bind(this)));
	},

	transformTreeConcreteDest: function (destPath, srcCollection) {
		srcCollection.forEach(function(srcFile) {
			var autoprefixed = this.renderAutoprefixer(
				srcFile.getContent(),
				srcCollection.getOptions().browsers
			);
			srcFile.setContent(autoprefixed);
		}.bind(this));
	},

	treeToTree: function *() {
		yield this.tree.fillContent();
		yield this.transformTree();

		return this.tree;
	}
});