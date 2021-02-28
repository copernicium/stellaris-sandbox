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
	},
	toLowerCase: function(str) {
		return str.toLowerCase();
	},
	toUpperCase: function(str) {
		return str.toUpperCase();
	},
	capitalize: function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
}

