import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { AppComponent } from 'src/app/app.component';
import { ListenerRemover } from 'src/app/shared/simple-listener';

@Component({
  selector: 'flipdown',
  templateUrl: './flipdown.component.html',
  styleUrls: ['./flipdown.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FlipdownComponent implements OnInit {

  @Input()
  uts: number;

  @Output()
  onEndTime: EventEmitter<any> = new EventEmitter();

  // FlipDown DOM element
  @ViewChild('flipdown')
  element: ElementRef;

  theme: string;
  headings = ["Days", "Hours", "Minutes", "Seconds"];

  // Initialised?
  initialised = false;

  // Time at instantiation in seconds
  now: number;

  // UTS to count down to
  epoch: number;

  // UTS passed to FlipDown is in the past
  countdownEnded = false;

  // User defined callback for countdown end
  hasEndedCallback = null;

  // Rotor DOM elements
  rotors = [];
  rotorLeafFront = [];
  rotorLeafRear = [];
  rotorTops = [];
  rotorBottoms = [];

  // Interval
  countdown = null;

  // Number of days remaining
  daysRemaining = 0;

  // Clock values as numbers
  clockValues: any = {};

  // Clock values as strings
  clockStrings: any = {};

  // Clock values as array
  clockValuesAsString = [];
  prevClockValuesAsString = [];

  daysremaining: number;
  rotorTop: any;
  rotorBottom: any;

  private onThemeChangedRemover: ListenerRemover;

  constructor() {
  }

  ngOnInit(): void {
    if (!this.uts || this.uts < 0) {
      throw new Error(
        `Wrong timestamp: ${this.uts}`
      );
    }

    this.theme = AppComponent.instance.isDarkTheme? "light": "dark";

    this.onThemeChangedRemover = AppComponent.instance.onThemeChanged.add(() => {
      this.theme = AppComponent.instance.isDarkTheme? "light": "dark";
      this._setOptions();
    });
  }

  ngAfterViewInit() {
    // Set options
    this._setOptions();

    // Time at instantiation in seconds
    this.now = this._getTime();

    // UTS to count down to
    this.epoch = this.uts;

    // Start the countdown
    this.start();
  }

  ngOnDestroy() {
    clearInterval(this.countdown);
    this.onThemeChangedRemover && this.onThemeChangedRemover();
  }

  /**
   * @name start
   * @description Start the countdown
   **/
  start() {
    // Initialise the clock
    if (!this.initialised) this._init();

    // Set up the countdown interval
    this.countdown = setInterval(this._tick.bind(this), 1000);

    // Call a function once the countdown ends
    this.hasEndedCallback = function () {
      this.onEndTime.emit();
      this.hasEndedCallback = null;
    };
  }

  /**
   * @name _getTime
   * @description Get the time in seconds (unix timestamp)
   **/
  _getTime() {
    //return this.web3Service.currenTime / 1000;
    return new Date().getTime() / 1000;
  }

  /**
   * @name _hasCountdownEnded
   * @description Has the countdown ended?
   **/
  _hasCountdownEnded() {
    // Countdown has ended
    if (this.epoch - this.now < 0) {
      this.countdownEnded = true;

      // Fire the ifEnded callback once if it was set
      if (this.hasEndedCallback != null) {
        // Call ifEnded callback
        this.hasEndedCallback();

        // Remove the callback
        this.hasEndedCallback = null;
      }

      return true;

      // Countdown has not ended
    } else {
      this.countdownEnded = false;
      return false;
    }
  }

  /**
   * @name _setOptions
   * @description Set optional configuration settings
   **/
  _setOptions() {
    // Apply theme
    this.element.nativeElement.classList.remove(`flipdown__theme-light`);
    this.element.nativeElement.classList.remove(`flipdown__theme-dark`);
    this.element.nativeElement.classList.add(`flipdown__theme-${this.theme}`);
  }

  /**
   * @name _init
   * @description Initialise the countdown
   **/
  _init() {
    this.initialised = true;

    // Check whether countdown has ended and calculate how many digits the day counter needs
    if (this._hasCountdownEnded()) {
      this.daysremaining = 0;
    } else {
      this.daysremaining = Math.floor(
        (this.epoch - this.now) / 86400
      ).toString().length;
    }
    var dayRotorCount = this.daysremaining <= 2 ? 2 : this.daysremaining;

    // Create and store rotors
    for (var i = 0; i < dayRotorCount + 6; i++) {
      this.rotors.push(this._createRotor(0));
    }

    // Create day rotor group
    var dayRotors = [];
    for (var i = 0; i < dayRotorCount; i++) {
      dayRotors.push(this.rotors[i]);
    }
    this.element.nativeElement.appendChild(this._createRotorGroup(dayRotors, 0));

    // Create other rotor groups
    var count = dayRotorCount;
    for (var i = 0; i < 3; i++) {
      var otherRotors = [];
      for (var j = 0; j < 2; j++) {
        otherRotors.push(this.rotors[count]);
        count++;
      }
      this.element.nativeElement.appendChild(this._createRotorGroup(otherRotors, i + 1));
    }

    // Store and convert rotor nodelists to arrays
    this.rotorLeafFront = Array.prototype.slice.call(
      this.element.nativeElement.getElementsByClassName("rotor-leaf-front")
    );
    this.rotorLeafRear = Array.prototype.slice.call(
      this.element.nativeElement.getElementsByClassName("rotor-leaf-rear")
    );
    this.rotorTop = Array.prototype.slice.call(
      this.element.nativeElement.getElementsByClassName("rotor-top")
    );
    this.rotorBottom = Array.prototype.slice.call(
      this.element.nativeElement.getElementsByClassName("rotor-bottom")
    );

    // Set initial values;
    this._tick();
    this._updateClockValues(true);
  }

  /**
   * @name _createRotorGroup
   * @description Add rotors to the DOM
   * @param rotors - A set of rotors
   **/
  _createRotorGroup(rotors: any[], rotorIndex: number) {
    var rotorGroup = document.createElement("div");
    rotorGroup.className = "rotor-group";

    var dayRotorGroupHeading = document.createElement("div");
    dayRotorGroupHeading.className = "rotor-group-heading";
    dayRotorGroupHeading.setAttribute(
      "data-before",
      this.headings[rotorIndex]
    );
    rotorGroup.appendChild(dayRotorGroupHeading);

    var rotorsCnt = document.createElement("div");
    rotorsCnt.className = "rotors";
    rotorGroup.appendChild(rotorsCnt);

    this.appendChildren(rotorsCnt, rotors);

    return rotorGroup;
  }

  /**
   * @name _createRotor
   * @description Create a rotor DOM element
   * @param v - Initial rotor value
   **/
  _createRotor(v = 0) {
    var rotor = document.createElement("div");
    var rotorLeaf = document.createElement("div");
    var rotorLeafRear = document.createElement("figure");
    var rotorLeafFront = document.createElement("figure");
    var rotorTop = document.createElement("div");
    var rotorBottom = document.createElement("div");
    rotor.className = "rotor";
    rotorLeaf.className = "rotor-leaf";
    rotorLeafRear.className = "rotor-leaf-rear";
    rotorLeafFront.className = "rotor-leaf-front";
    rotorTop.className = "rotor-top";
    rotorBottom.className = "rotor-bottom";
    rotorLeafRear.textContent = v.toString();
    rotorTop.textContent = v.toString();
    rotorBottom.textContent = v.toString();
    this.appendChildren(rotor, [rotorLeaf, rotorTop, rotorBottom]);
    this.appendChildren(rotorLeaf, [rotorLeafRear, rotorLeafFront]);
    return rotor;
  }

  /**
   * @name _tick
   * @description Calculate current tick
   **/
  _tick() {
    // Get time now
    this.now = this._getTime();

    // Between now and epoch
    var diff = this.epoch - this.now <= 0 ? 0 : this.epoch - this.now;

    // Days remaining
    this.clockValues.d = Math.floor(diff / 86400);
    diff -= this.clockValues.d * 86400;

    // Hours remaining
    this.clockValues.h = Math.floor(diff / 3600);
    diff -= this.clockValues.h * 3600;

    // Minutes remaining
    this.clockValues.m = Math.floor(diff / 60);
    diff -= this.clockValues.m * 60;

    // Seconds remaining
    this.clockValues.s = Math.floor(diff);

    // Update clock values
    this._updateClockValues();

    // Has the countdown ended?
    this._hasCountdownEnded();
  }

  /**
   * @name _updateClockValues
   * @description Update the clock face values
   * @param init - True if calling for initialisation
   **/
  _updateClockValues(init = false) {
    // Build clock value strings
    this.clockStrings.d = this.pad(this.clockValues.d, 2);
    this.clockStrings.h = this.pad(this.clockValues.h, 2);
    this.clockStrings.m = this.pad(this.clockValues.m, 2);
    this.clockStrings.s = this.pad(this.clockValues.s, 2);

    // Concat clock value strings
    this.clockValuesAsString = (
      this.clockStrings.d +
      this.clockStrings.h +
      this.clockStrings.m +
      this.clockStrings.s
    ).split("");

    // Update rotor values
    // Note that the faces which are initially visible are:
    // - rotorLeafFront (top half of current rotor)
    // - rotorBottom (bottom half of current rotor)
    // Note that the faces which are initially hidden are:
    // - rotorTop (top half of next rotor)
    // - rotorLeafRear (bottom half of next rotor)
    this.rotorLeafFront.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i];
    });

    this.rotorBottom.forEach((el, i) => {
      el.textContent = this.prevClockValuesAsString[i];
    });

    function rotorTopFlip() {
      this.rotorTop.forEach((el, i) => {
        if (el.textContent != this.clockValuesAsString[i]) {
          el.textContent = this.clockValuesAsString[i];
        }
      });
    }

    function rotorLeafRearFlip() {
      this.rotorLeafRear.forEach((el, i) => {
        if (el.textContent != this.clockValuesAsString[i]) {
          el.textContent = this.clockValuesAsString[i];
          el.parentElement.classList.add("flipped");
          var flip = setInterval(
            function () {
              el.parentElement.classList.remove("flipped");
              clearInterval(flip);
            }.bind(this),
            500
          );
        }
      });
    }

    // Init
    if (!init) {
      setTimeout(rotorTopFlip.bind(this), 500);
      setTimeout(rotorLeafRearFlip.bind(this), 500);
    } else {
      rotorTopFlip.call(this);
      rotorLeafRearFlip.call(this);
    }

    // Save a copy of clock values for next tick
    this.prevClockValuesAsString = this.clockValuesAsString;
  }

  /**
 * @name pad
 * @description Prefix a number with zeroes
 * @param n - Number to pad
 * @param len - Desired length of number
 **/
  pad(n: string, len: number) {
    n = n.toString();
    return n.length < len ? this.pad("0" + n, len) : n;
  }

  /**
   * @name appendChildren
   * @description Add multiple children to an element
   * @param parent - Parent
   **/
  appendChildren(parent: any, children: any[]) {
    children.forEach((el) => {
      parent.appendChild(el);
    });
  }
}
