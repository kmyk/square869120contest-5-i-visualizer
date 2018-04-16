.PHONY: build

build:
	git submodule update
	cp longcontest-visualizer-framework/package.json .
	cp longcontest-visualizer-framework/index.html .
	cp longcontest-visualizer-framework/index.ts .
	cp longcontest-visualizer-framework/gif.worker.js .
	patch index.html index.html.patch
	patch index.ts index.ts.patch
	npm install
	tsc index.ts
