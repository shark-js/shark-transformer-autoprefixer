'use strict';

const Transformer   = require('shark-transformer');
const autoprefixer  = require('autoprefixer-core');
const extend        = require('node.extend');
const co            = require('co');
const VError        = require('verror');
const path          = require('path');

const loggerOpName = 'transformer-autoprefixer';

module.exports = Transformer.extend({
	init: function() {
		this.options = extend({}, this.optionsDefault, this.options);
	},

	optionsDefault: {
		browsers: [
			'Android 2.3',
			'Android >= 4',
			'Chrome >= 20',
			'Firefox >= 24',
			'iOS >= 6',
			'Opera >= 12',
			'Safari >= 6'
		]
	},

	renderAutoprefixer: function(css, prefixes, destPath) {
		var time = this.logger.time();
		var sizeBefore = css.length;
		var result;
		try {
			if (!this.logger.inPipe()) {
				this.logger.info({
					opName: loggerOpName,
					opType: this.logger.OP_TYPE.STARTED
				}, path.basename(destPath));
			}

			if (prefixes) {
				result = autoprefixer({
					browsers: prefixes
				}).process(css).css;
			}
			else {
				result = autoprefixer.process(css).css;
			}

			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.FINISHED_SUCCESS,
				duration: time.delta(),
				size: {before: sizeBefore, after: result.length}
			}, this.logger.inPipe() ? '' : path.basename(destPath));

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
		var options = extend({}, this.options, srcCollection.getOptions().autoprefixer);
		if (options.enabled === false) {
			return;
		}

		srcCollection.forEach(function(srcFile) {
			var autoprefixed = this.renderAutoprefixer(
				srcFile.getContent(),
				options.browsers,
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