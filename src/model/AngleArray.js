import Angle from "./Angle";

/**********************************************************************/
export default class AngleArray {
  constructor(a, unit) {
    this._a = a.map((value) => new Angle(value, unit));
  }

  get(index) {
    if (index < 0)
      return this._a[this._a.length - index];
    else
      return this._a[index];
  }

  map(callback) { return this._a.map(callback); }
  filter(callback) { return this._a.filter(callback); }
  find(callback) { return this._a.find(callback); }
  findIndex(callback) { return this._a.findIndex(callback); }
  indexOf(value, fromIndex) {
    const valueRadians = new Angle(value).rad;
    return this.rad.indexOf(valueRadians, fromIndex);
  }

  get length() { return this._a.length; }
  get deg() { return this.map((value) => value.deg); }
  get hr() { return this.map((value) => value.hr); }
  get rad() { return this.map((value) => value.rad); }

  add(a) {
    let b;
    if (a instanceof AngleArray) {
      if (a.length !== this.length)
        throw new Error(`Arrays have different lengths: ${this.length} ${a.length}`);
      b = new AngleArray(this.map((value, index) => value.add(a[index])));
    } else if (a instanceof Angle) {
      b = new AngleArray(this.map((value) => value.add(a)))
    } else {
      throw new Error(`Can only add Angles or AngleArrays, got ${typeof a}`);
    }
    return b;
  }

  dms(secondsPrecision, degreesWidth) {
    return this.map((a) => Angle.floatToSexagesimal(a.deg, secondsPrecision, degreesWidth));
  }

  hms(secondsPrecision, hours_width) {
    return this.map((a) => Angle.floatToSexagesimal(a.hr, secondsPrecision, hours_width));
  }

  hm(hours_width) {
    return this.hms(0, hours_width).map((a) => a.substring(1, 6));
  }

  clock() {
    return this.map((a) => a.clock());
  }

  branchcut(cut, period) {
    return new AngleArray(this.map((a) => Angle.branchcut(a, cut, period)));
  }

  /**
   * Find the first index where this array crosses above thresh.
   * 
   * @param {Angle} thresh
   * @returns {integer}
   */
  rise(thresh) {
    return this.findIndex((a, index, array) =>
      ((array[index - 1] < thresh) && (a >= thresh))
    );
  }

  /**
   * Index of transit (peak value).
   * 
   * @returns {integer} 
   */
  transit() {
    return this.indexOf(Math.max.apply(null, this._a));
  }


  /**
   * Find the first index where this array crosses below thresh.
   * 
   * @param {Angle} thresh
   * @returns {integer}
   */
  set(thresh) {
    return this.findIndex((a, index, array) =>
      (array[index - 1] > thresh) && (a <= thresh)
    );
  }

}
