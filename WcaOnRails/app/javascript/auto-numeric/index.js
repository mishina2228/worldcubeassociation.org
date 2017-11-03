import AutoNumeric from 'autonumeric';
import currenciesData from 'wca/currenciesData.js.erb';


function getCurrencyInfo(isoCode) {
  return currenciesData.byIso[isoCode] || currenciesData.byIso.USD;
}

// Create a mask for an amount input in the given currency, using autoNumeric
// 'action' can be either "init" or "update"
// '$element' is a jquery element for the targeted input field
wca.applyCurrencyMask = function(action, $element, currencyIsoCode) {
  let entry = getCurrencyInfo(currencyIsoCode);
  let currentVal = 0;

  // Get current val
  if (action == "update") {
    currentVal = getValueInCurrency($element);
  } else if (action == "init") {
    currentVal = $element.val();
  } else {
    throw new Error('Unsupported action for currency mask');
  }

  // Reconfigure
  $.data($element[0], "current_subunit_to_unit", entry.subunit_to_unit);
  let maskOptions = {
    currencySymbol: entry.symbol,
    currencySymbolPlacement: (entry.symbol_first) ? 'p' : 's',
    // If the currency has no subunit (subunit_to_unit is 1), then we don't need
    // decimals. For currencies with subunits we want to show decimals.
    decimalPlaces: (entry.subunit_to_unit == 1) ? 0 : 2,
    showWarnings: false,
  };

  let autoNumericObject = $element.data("autoNumericObject");

  if (autoNumericObject) {
    autoNumericObject.update(maskOptions);
  } else {
    autoNumericObject = new AutoNumeric($element[0], maskOptions);
    $element.data("autoNumericObject", autoNumericObject);
  }

  // Set new val
  autoNumericObject.set(currentVal/entry.subunit_to_unit);
};

// Retrieve the real value, in the currency's lowest denomination
// Assumes autoNumeric is running on element, and the number of subunit_to_unit has been set in data
function getValueInCurrency($element) {
  let currentVal = $element.data("autoNumericObject").getNumber();
  let multiplier = $.data($element[0], "current_subunit_to_unit");
  // Set back the value to the "lowest denomination" in the currency
  return currentVal * multiplier;
}

// Setup the mask for the selected element
wca.setupCurrencyMask = function($element) {
  let currencyIsoCode = $element.data("currency");
  let targetElemId = $element.data("target");

  wca.applyCurrencyMask('init', $element, currencyIsoCode);

  // Populate the actual hidden field on change
  $element.change(function() {
    $(targetElemId).val(getValueInCurrency($element));
  });
};
