'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const Transformer   = require('shark-transformer');
const autoprefixer  = require('autoprefixer-core');
const extend        = require('node.extend');
const co            = require('co');
const VError        = require('verror');
const path          = require('path');

const loggerOpName = 'transformer-autoprefixer';

module.exports = Transformer.extend({
	renderAutoprefixer: function(css, prefixes, destPath) {
		var time = this.logger.time();
		var sizeBefore = css.length;
		try {
			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.STARTED
			}, path.basename(destPath));

			if (prefixes) {
				var result = autoprefixer({
					browsers: prefixes
				}).process(css).css;
			}
			else {
				var result = autoprefixer.process(css).css;
			}

			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.FINISHED_SUCCESS,
				duration: time.delta(),
				size: {before: sizeBefore, after: result.length}
			}, path.basename(destPath));

			return result;
		}
		catch (error) {
			this.logger.warn({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.FINISHED_ERROR,
				duration: time.delta()
			}, path.basename(destPath), error.message);
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
				srcCollection.getOptions().browsers || this.options.browsers,
				destPath
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