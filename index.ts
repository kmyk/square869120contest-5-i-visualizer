declare var GIF: any;  // for https://github.com/jnordberg/gif.js

module framework {
    export class FileParser {
        private filename: string;
        private content: string[][];
        private y: number;
        private x: number

        constructor(filename: string, content: string) {
            this.filename = filename;
            this.content = [];
            for (const line of content.split('\n')) {
                const words = line.trim().split(new RegExp('\\s+'));
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }

        public isEOF(): boolean {
            return this.content.length <= this.y;
        }
        public getWord(): string {
            if (this.content.length <= this.y) {
                this.reportError('a word expected, but EOF');
            }
            if (this.content[this.y].length <= this.x) {
                this.reportError('a word expected, but newline');
            }
            const word = this.content[this.y][this.x];
            this.x += 1;
            return word;
        }
        public getInt(): number {
            const word = this.getWord();
            if (! word.match(new RegExp('^[-+]?[0-9]+$'))) {
                this.reportError(`a number expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            return parseInt(word);
        }
        public getNewline() {
            if (this.content.length <= this.y) {
                this.reportError('newline expected, but EOF');
            }
            if (this.x < this.content[this.y].length) {
                this.reportError(`newline expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            this.x = 0;
            this.y += 1;
        }

        public unwind() {
            if (this.x == 0) {
                this.y -= 1;
                this.x = this.content[this.y].length - 1;
            } else {
                this.x -= 1;
            }
        }
        public reportError(msg: string) {
            msg = `${this.filename}: line ${this.y + 1}: ${msg}`;
            alert(msg);
            throw new Error(msg);
        }
    }

    export class FileSelector {
        public callback: (inputContent: string, outputContent: string) => void;

        private inputFile: HTMLInputElement;
        private outputFile: HTMLInputElement;
        private reloadButton: HTMLInputElement;

        constructor() {
            this.inputFile = <HTMLInputElement> document.getElementById("inputFile");
            this.outputFile = <HTMLInputElement> document.getElementById("outputFile");
            this.reloadButton = <HTMLInputElement> document.getElementById("reloadButton");

            this.reloadFilesClosure = () => { this.reloadFiles(); };
            this. inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }

        private reloadFilesClosure: () => void;
        reloadFiles() {
            if (this.inputFile.files.length == 0 || this.outputFile.files.length == 0) return;
            loadFile(this.inputFile.files[0], (inputContent: string) => {
                loadFile(this.outputFile.files[0], (outputContent: string) => {
                    this. inputFile.removeEventListener('change', this.reloadFilesClosure);
                    this.outputFile.removeEventListener('change', this.reloadFilesClosure);
                    this.reloadButton.classList.remove('disabled');
                    if (this.callback !== undefined) {
                        this.callback(inputContent, outputContent);
                    }
                });
            });
        }
    }

    export class RichSeekBar {
        public callback: (value: number) => void;

        private seekRange: HTMLInputElement;
        private seekNumber: HTMLInputElement;
        private fpsInput: HTMLInputElement;
        private firstButton: HTMLInputElement;
        private prevButton: HTMLInputElement;
        private playButton: HTMLInputElement;
        private nextButton: HTMLInputElement;
        private lastButton: HTMLInputElement;
        private runIcon: HTMLElement;
        private intervalId: number;
        private playClosure: () => void;
        private stopClosure: () => void;

        constructor() {
            this.seekRange  = <HTMLInputElement> document.getElementById("seekRange");
            this.seekNumber = <HTMLInputElement> document.getElementById("seekNumber");
            this.fpsInput = <HTMLInputElement> document.getElementById("fpsInput");
            this.firstButton = <HTMLInputElement> document.getElementById("firstButton");
            this.prevButton = <HTMLInputElement> document.getElementById("prevButton");
            this.playButton = <HTMLInputElement> document.getElementById("playButton");
            this.nextButton = <HTMLInputElement> document.getElementById("nextButton");
            this.lastButton = <HTMLInputElement> document.getElementById("lastButton");
            this.runIcon = document.getElementById("runIcon");
            this.intervalId = null;

            this.setMinMax(-1, -1);
            this.seekRange .addEventListener('change', () => { this.setValue(parseInt(this.seekRange .value)); });
            this.seekNumber.addEventListener('change', () => { this.setValue(parseInt(this.seekNumber.value)); });
            this.seekRange .addEventListener('input',  () => { this.setValue(parseInt(this.seekRange .value)); });
            this.seekNumber.addEventListener('input',  () => { this.setValue(parseInt(this.seekNumber.value)); });
            this.fpsInput.addEventListener('change', () => { if (this.intervalId !== null) { this.play(); } });
            this.firstButton.addEventListener('click', () => { this.stop(); this.setValue(this.getMin()); });
            this.prevButton .addEventListener('click', () => { this.stop(); this.setValue(this.getValue() - 1); });
            this.nextButton .addEventListener('click', () => { this.stop(); this.setValue(this.getValue() + 1); });
            this.lastButton .addEventListener('click', () => { this.stop(); this.setValue(this.getMax()); });
            this.playClosure = () => { this.play(); };
            this.stopClosure = () => { this.stop(); };
            this.playButton.addEventListener('click', this.playClosure);
        }

        public setMinMax(min: number, max: number) {
            this.seekRange.min   = this.seekNumber.min   = min.toString();
            this.seekRange.max   = this.seekNumber.max   = max.toString();
            this.seekRange.step  = this.seekNumber.step  = '1';
            this.setValue(min);
        }
        public getMin(): number {
            return parseInt(this.seekRange.min);
        }
        public getMax(): number {
            return parseInt(this.seekRange.max);
        }

        public setValue(value: number) {
            value = Math.max(this.getMin(),
                    Math.min(this.getMax(), value));  // clamp
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value);
            }
        }
        public getValue(): number {
            return parseInt(this.seekRange.value);
        }

        public getDelay(): number {
            const fps = parseInt(this.fpsInput.value);
            return Math.floor(1000 / fps);
        }
        private resetInterval() {
            if (this.intervalId !== undefined) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }
        }
        public play() {
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.   addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) {  // if last, go to first
                this.setValue(this.getMin());
            }
            this.resetInterval();
            this.intervalId = setInterval(() => {
                if (this.getValue() == this.getMax()) {
                    this.stop();
                } else {
                    this.setValue(this.getValue() + 1);
                }
            }, this.getDelay());
        }
        public stop() {
            this.playButton.removeEventListener('click', this.stopClosure);
            this.playButton.   addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        }
    }

    const loadFile = (file: File, callback: (value: string) => void) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            callback(reader.result);
        }
    };

    const saveUrlAsLocalFile = (url: string, filename: string) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        const evt = document.createEvent('MouseEvent');
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
    };

    export class FileExporter {
        constructor(canvas: HTMLCanvasElement, seek: RichSeekBar) {
            const saveAsImage = <HTMLInputElement> document.getElementById("saveAsImage");
            const saveAsVideo = <HTMLInputElement> document.getElementById("saveAsVideo");

            saveAsImage.addEventListener('click', () => {
                saveUrlAsLocalFile(canvas.toDataURL('image/png'), 'canvas.png');
            });

            saveAsVideo.addEventListener('click', () => {
                if (location.href.match(new RegExp('^file://'))) {
                    alert('to use this feature, you must re-open this file via "http://", instead of "file://". e.g. you can use "$ python -m SimpleHTTPServer 8000"');
                }
                seek.stop();
                const gif = new GIF();
                for (let i = seek.getMin(); i < seek.getMax(); ++ i) {
                    seek.setValue(i);
                    gif.addFrame(canvas, { copy: true, delay: seek.getDelay() });
                }
                gif.on('finished', function(blob) {
                    saveUrlAsLocalFile(URL.createObjectURL(blob), 'canvas.gif');
                });
                gif.render();
                alert('please wait for a while, about 2 minutes.');
            });
        }
    }
}

module visualizer {
    class InputFile {
        public h: number;
        public w: number;
        public n: number;
        public jewels: number[];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content);

            // parse
            this.h = parser.getInt();
            this.w = parser.getInt();
            this.n = parser.getInt();
            parser.getNewline();
            this.jewels = [];
            for (let i = 0; i < this.n; ++ i) {
                const y = parser.getInt();
                const x = parser.getInt();
                parser.getNewline();
                this.jewels.push(y * this.w + x);
            }
        }
    };

    class OutputFile {
        public pattern: [number, number][];
        public commands: string[];

        constructor(content: string) {
            const parser = new framework.FileParser('<output-file>', content);

            // parse
            const p = parser.getInt();
            parser.getNewline();
            this.pattern = [];
            for (let i = 0; i < p; ++ i) {
                const y = parser.getInt();
                const x = parser.getInt();
                parser.getNewline();
                this.pattern.push([ y, x ]);
            }
            this.commands = [];
            while (! parser.isEOF()) {
                const c = parser.getWord();
                parser.getNewline();
                this.commands.push(c);
            }
        }
    };

    class TesterFrame {
        public input: InputFile;
        public output: OutputFile;
        public previousFrame: TesterFrame | null;
        public age: number;
        public y: number;
        public x: number;
        public jewels: number[];
        public revealed: number[];

        constructor(input: InputFile, output: OutputFile);
        constructor(frame: TesterFrame);
        constructor(something1: any, something2?: any) {

            if (something1 instanceof InputFile) {  // initial frame
                this.input = something1 as InputFile;
                this.output = something2 as OutputFile;
                this.previousFrame = null;
                this.age = 0;

                this.y = 0;
                this.x = 0;
                this.jewels = this.input.jewels.slice();
                this.revealed = [];
                for (let z = 0; z < this.input.h * this.input.w; ++ z) this.revealed.push(0);

            } else if (something1 instanceof TesterFrame) {  // successor frame
                this.previousFrame = something1 as TesterFrame;
                this.input = this.previousFrame.input;
                this.output = this.previousFrame.output;
                this.age = this.previousFrame.age + 1;

                const cmd = this.output.commands[this.age - 1];
                this.y = this.previousFrame.y + { 'U': -1, 'D': +1, 'R':  0, 'L':  0 }[cmd];
                this.x = this.previousFrame.x + { 'U':  0, 'D':  0, 'R': +1, 'L': -1 }[cmd];
                this.jewels = this.previousFrame.jewels.slice();
                if (this.jewels.indexOf(this.y * this.input.w + this.x) != -1) {
                    const i = this.jewels.indexOf(this.y * this.input.w + this.x);
                    this.jewels.splice(i, 1);
                }
                let close = false;
                for (const p of this.output.pattern) {
                    const ny = this.y + p[0];
                    const nx = this.x + p[1];
                    if (0 <= ny && ny < this.input.h && 0 <= nx && nx < this.input.w) {
                        if (this.jewels.indexOf(ny * this.input.w + nx) != -1) {
                            close = true;
                        }
                    }
                }
                this.revealed = this.previousFrame.revealed.slice();
                this.revealed[this.y * this.input.w + this.x] = 2;
                for (const p of this.output.pattern) {
                    const ny = this.y + p[0];
                    const nx = this.x + p[1];
                    if (0 <= ny && ny < this.input.h && 0 <= nx && nx < this.input.w) {
                        const z = ny * this.input.w + nx;
                        this.revealed[z] = ! close ? 2 : Math.max(this.revealed[z], 1);
                    }
                }
            }
        }
    };

    class Tester {
        public frames: TesterFrame[];
        constructor(inputContent: string, outputContent: string) {
            const input  = new  InputFile( inputContent);
            const output = new OutputFile(outputContent);
            this.frames = [ new TesterFrame(input, output) ];
            for (const command of output.commands) {
                let lastFrame = this.frames[this.frames.length - 1];
                this.frames.push( new TesterFrame(lastFrame) );
            }
        }
    };

    class Visualizer {
        private canvas: HTMLCanvasElement;
        private ctx: CanvasRenderingContext2D;
        private scoreInput: HTMLInputElement;
        private moveInput: HTMLInputElement;

        constructor() {
            this.canvas = <HTMLCanvasElement> document.getElementById("canvas");  // TODO: IDs should be given as arguments
            const size = 800;
            this.canvas.height = size;  // pixels
            this.canvas.width  = size;  // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.moveInput = <HTMLInputElement> document.getElementById("moveInput");
            this.scoreInput = <HTMLInputElement> document.getElementById("scoreInput");
        }

        public draw(frame: TesterFrame) {
            // update input tags
            this.scoreInput.value = "";
            this.moveInput.value = frame.age.toString();

            // prepare from input
            const scale = Math.min(this.canvas.height, this.canvas.width) / frame.input.h;  // height == width

            // update the canvas
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // draw entities
            console.log(frame);
            for (let y = 0; y < frame.input.h; ++ y) {
                for (let x = 0; x < frame.input.w; ++ x) {
                    const z = y * frame.input.w + x;
                    if (y == frame.y && x == frame.x) {
                        this.ctx.fillStyle = 'red';
                    } else if (frame.jewels.indexOf(z) != -1) {
                        this.ctx.fillStyle = 'blue';
                    } else if (frame.revealed[z] == 2) {
                        this.ctx.fillStyle = 'white';
                    } else if (frame.revealed[z] == 1) {
                        this.ctx.fillStyle = 'gray';
                    } else {
                        this.ctx.fillStyle = 'black';
                    }
                    this.ctx.fillRect(x * scale + 1, y * scale + 1, scale - 1, scale - 1);
                    for (const p of frame.output.pattern) {
                        if (y == frame.y + p[0] && x == frame.x + p[1]) {
                            this.ctx.fillStyle = 'yellow';
                            this.ctx.fillRect((x + 0.2) * scale, (y + 0.2) * scale, 0.6 * scale, 0.6 * scale);
                        }
                    }
                }
            }
        }

        public getCanvas(): HTMLCanvasElement {
            return this.canvas;
        }
    };

    export class App {
        public visualizer: Visualizer;
        public tester: Tester;
        public loader: framework.FileSelector;
        public seek: framework.RichSeekBar;
        public exporter: framework.FileExporter;

        constructor() {
            this.visualizer = new Visualizer();
            this.loader = new framework.FileSelector();
            this.seek = new framework.RichSeekBar();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas(), this.seek);

            this.seek.callback = (value: number) => {
                if (this.tester !== undefined) {
                    this.visualizer.draw(this.tester.frames[value]);
                }
            };

            this.loader.callback = (inputContent: string, outputContent: string) => {
                this.tester = new Tester(inputContent, outputContent);
                this.seek.setMinMax(0, this.tester.frames.length - 1);
                this.seek.setValue(0);
                this.seek.play();
            }
        }
    }
}

window.onload = () => {
    new visualizer.App();
};
