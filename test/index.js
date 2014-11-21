'use strict';

const chai      = require('chai');
const coMocha   = require('co-mocha');
const expect    = chai.expect;

const TransformerAutoprefixer = require('../');
const Tree      = require('shark-tree');
const Logger    = require('shark-logger');
const cofse     = require('co-fs-extra');
const path      = require('path');

describe('Initialization', function() {
	before(function *() {
		this.logger = Logger({
			name: 'TransformerAutoprefixerLogger'
		});

		this.browsers = [
			'Android 2.3',
			'Android >= 4',
			'Chrome >= 20',
			'Firefox >= 24', // Firefox 24 is the latest ESR
			'iOS >= 6',
			'Opera >= 12',
			'Safari >= 6'
		];

		this.files = {};
		this.src1 = path.join(__dirname, './fixtures/test-1.css');
		this.src2 = path.join(__dirname, './fixtures/test-2.css');

		this.dest1 = path.join(__dirname, './fixtures/test-1.dest.css');
		this.dest2 = path.join(__dirname, './fixtures/test-2.dest.css');

		this.expectDest1 = path.join(__dirname, './fixtures/test-1.dest.expect.css');
		this.expectDest2 = path.join(__dirname, './fixtures/test-2.dest.expect.css');
		this.expectDestContent1 = yield cofse.readFile(this.expectDest1, { encoding: 'utf8' });
		this.expectDestContent2 = yield cofse.readFile(this.expectDest2, { encoding: 'utf8' });

		yield cofse.writeFile(this.dest1, '');
		yield cofse.writeFile(this.dest2, '');

		this.files[this.dest1] = {
			files: [this.src1, this.src2],
			options: {
				browsers: this.browsers
			}
		};

		this.files[this.dest2] = {
			files: [this.src2],
			options: {
				browsers: this.browsers
			}
		};

		this.tree = Tree(this.files, this.logger);
	});

	it('should autoprefix content and output valid result', function *() {
		var tree = yield TransformerAutoprefixer.treeToTree(this.tree, this.logger);

		expect(tree.getSrcCollectionByDest(this.dest1).getFileByIndex(0).getContent())
			.equal(this.expectDestContent1);

		expect(tree.getSrcCollectionByDest(this.dest1).getFileByIndex(1).getContent())
			.equal(this.expectDestContent2);

		expect(tree.getSrcCollectionByDest(this.dest2).getFileByIndex(0).getContent())
			.equal(this.expectDestContent2);
	})
});
