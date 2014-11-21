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

	transformTree: function() {
		try {
			var _tree = this.tree.getTree();
			for (var destPath in _tree) {
				if (_tree.hasOwnProperty(destPath)) {
					this.transformTreeConcreteDest(destPath, this.tree.getSrcCollectionByDest(destPath));
				}
			}
		}
		catch (error) {
			throw new VError(error, 'TransformerAutoprefixer#transformTree');
		}
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
		try {
			 yield this.tree.fillContent();
			 this.transformTree();

			return this.tree;
		}
		catch (error) {
			throw new VError(error, 'TransformerAutoprefixer#treeToTree');
		}
	}
});