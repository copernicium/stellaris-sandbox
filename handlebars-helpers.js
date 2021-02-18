module.exports = {
	switch: function(value, options) {
		this.switch_value = value;
		return options.fn(this);
	},
	case: function(value, options) {
		if (value == this.switch_value) {
			return options.fn(this);
		}
	},
	ifEquals: function(value1, value2, options) {
		return (value1 == value2) ? options.fn(this) : options.inverse(this); 
	},
	unlessEquals: function(value1, value2, options) {
		return (value1 != value2) ? options.fn(this) : options.inverse(this);
	},
	isEqual: function(value1, value2) {
		return value1 == value2;
	}
}

