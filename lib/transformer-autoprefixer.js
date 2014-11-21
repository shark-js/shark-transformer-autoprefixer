'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const Transformer   = require('shark-transformer');
const autoprefixer  = require('autoprefixer-core');
const extend        = require('node.extend');
const co            = require('co');

module.exports = Transformer.extend({
	renderAutoprefixer: function(css, prefixes) {
		return autoprefixer({
			browsers: prefixes
		}).process(css).css;
	},

	transformTree: function *() {
		return this.tree.forEachDestSeries(co.wrap(function *(destPath, srcCollection, done) {
			try {
				yield this.transformTreeConcreteDest(destPath, srcCollection);
				done();
			}
			catch (error) {
				done(new VError(error));
			}
		}.bind(this)));
	},

	transformTreeConcreteDest: function *(destPath, srcCollection) {
		try {
			srcCollection.forEach(function(srcFile) {
				var autoprefixed = this.renderAutoprefixer(
					srcFile.getContent(),
					srcCollection.getOptions().browsers
				);
				srcFile.setContent(autoprefixed);
			}.bind(this));
		}
		catch (error) {
			throw new VError(error, 'renderTreeDest');
		}
	},

	treeToTree: function *() {
		yield this.tree.fillContent();
		yield this.transformTree();

		return this.tree;
	}
});