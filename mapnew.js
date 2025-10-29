import Map from "https://js.arcgis.com/4.33/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.33/@arcgis/core/views/MapView.js";
import FeatureLayer from "https://js.arcgis.com/4.33/@arcgis/core/layers/FeatureLayer.js";
import Legend from "https://js.arcgis.com/4.33/@arcgis/core/widgets/Legend.js";
import Graphic from "https://js.arcgis.com/4.33/@arcgis/core/Graphic.js";

window.addEventListener("DOMContentLoaded", () => {
  const statesLayer = new FeatureLayer({
    url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Generalized_Boundaries/FeatureServer/0",
    title: "US States",
    popupTemplate: {
      title: "{STATE_NAME }",
      content: "Population: {POPULATION }"
    },
    opacity: 0.9
  });

  const map = new Map({
    basemap: "gray-vector",
    layers: []
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-100.3487846, 39.58907],
    zoom: 3
  });

  const legend = new Legend({
    view: view
  });

  view.ui.add(legend, "bottom-left");
  var $table = $('#table')

  if ($table && $table.length) {
    $table.bootstrapTable();
  }

  let statesLoaded = false;
  let medianLoaded = false;
  let educationLoaded = false;

  const submitBtn = document.querySelector('form button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  setTimeout(() => {
    if (submitBtn && submitBtn.disabled) {
      submitBtn.disabled = false;
      console.warn('Submit enabled after timeout — some data may be missing.');
    }
  }, 10000);

  var loadStates = function () {
    var table = document.getElementById("myTable");
    Object.entries(stateObj).sort().forEach(([key, value], index) => {
      $table.bootstrapTable('insertRow', {
        index: index,
        row: { state: key.replace("_", " ") }
      })
    });
    let query = statesLayer.createQuery();
    query.returnGeometry = true;
    query.outFields = ["STATE_ABBR", "STATE_NAME"];
    statesLayer.queryFeatures(query)
      .then(function (response) {
        response.features.forEach(function (feature, ind) {
          var abbr = feature.attributes.STATE_ABBR;
          if (abbr && abbr !== "DC") {
            var matchKey = Object.keys(stateObj).find(k => {
              return stateObj[k] && stateObj[k].abb && stateObj[k].abb.toUpperCase() === abbr.toUpperCase();
            });
            if (matchKey) {
              stateObj[matchKey]['geometry'] = feature.geometry;
            }
          }
        })
        statesLoaded = true;
        if (statesLoaded && medianLoaded && educationLoaded) {
          if (submitBtn) submitBtn.disabled = false;
        }
      }).catch(function (err) {
        statesLoaded = true;
        if (medianLoaded && educationLoaded && submitBtn) submitBtn.disabled = false;
      });
  }
  loadStates()

  var medianIncomeUrl = "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/ACS_Median_Income_by_Race_and_Age_Selp_Emp_Boundaries/FeatureServer/0"
  const medianIncomeLayer = new FeatureLayer({
    url: medianIncomeUrl,
    title: "Median Income",
  });

  var loadAdditionalData = function () {
    let additionalQuery = medianIncomeLayer.createQuery();
    additionalQuery.returnGeometry = false;
    additionalQuery.outFields = "*"
    medianIncomeLayer.queryFeatures(additionalQuery).then(function (r) {
      r.features.forEach(function (feature) {
        var abbr = feature.attributes && feature.attributes['STUSPS'];
        if (!abbr || abbr === "DC") return;
        var matchKey = Object.keys(stateObj).find(k => {
          return stateObj[k] && stateObj[k].abb && stateObj[k].abb.toUpperCase() === abbr.toUpperCase();
        });
        if (!matchKey) return;
        var income = null;
        if ('B19049_001E' in feature.attributes) {
          income = feature.attributes['B19049_001E'];
        } else if ('MEDIAN_INCOME' in feature.attributes) {
          income = feature.attributes['MEDIAN_INCOME'];
        }
        stateObj[matchKey]['medianIncome'] = income;
      });
      medianLoaded = true;
      if (statesLoaded && medianLoaded && educationLoaded) {
        if (submitBtn) submitBtn.disabled = false;
      }
    }).catch(function (err) {
      medianLoaded = true;
      if (statesLoaded && medianLoaded && educationLoaded) {
        if (submitBtn) submitBtn.disabled = false;
      } else {
        if (submitBtn) submitBtn.disabled = false;
      }
    })
  }

  loadAdditionalData()

  var educationUrl = "https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Educational_Attainment_Boundaries/FeatureServer/0"
  const educationLayer = new FeatureLayer({
    url: educationUrl,
    title: "Educational Attainment"
  })

  var loadEducationData = function () {
    let educationQuery = educationLayer.createQuery()
    educationQuery.returnGeometry = false
    educationQuery.outFields = "*"
    educationLayer.queryFeatures(educationQuery).then(function (res) {
      res.features.forEach(function (feature) {
        var abbr = feature.attributes && feature.attributes['STUSPS']
        if (!abbr || abbr === "DC") return
        var matchKey = Object.keys(stateObj).find(k => {
          return stateObj[k] && stateObj[k].abb && stateObj[k].abb.toUpperCase() === abbr.toUpperCase()
        })
        if (!matchKey) return
        var educationValue = null
        if ('B15003_022E' in feature.attributes) {
          educationValue = feature.attributes['B15003_022E']
        } else if ('EDUCATION' in feature.attributes) {
          educationValue = feature.attributes['EDUCATION']
        }
        stateObj[matchKey]['educationLevel'] = educationValue
      })
      educationLoaded = true
      if (statesLoaded && medianLoaded && educationLoaded) {
        if (submitBtn) submitBtn.disabled = false
      }
    }).catch(function (err) {
      educationLoaded = true
      if (statesLoaded && medianLoaded && educationLoaded) {
        if (submitBtn) submitBtn.disabled = false
      }
    })
  }

  loadEducationData()

  const between = (x, min, max) => {
    return x >= min && x <= max;
  }
  const getRate = function (arr, inc) {
    if (!arr || !Array.isArray(arr.range) || !Array.isArray(arr.rate)) {
      return [0, 0];
    }
    let taxRate = 0;
    for (var i = 0; i < arr.range.length; i++) {
      if (between(inc, arr.range[i][0], arr.range[i][1])) {
        taxRate = arr.rate[i];
        return [taxRate, arr.range[i][0]];
      }
    }
    return [arr.rate[arr.rate.length - 1] || 0, arr.range[arr.range.length - 1] ? arr.range[arr.range.length - 1][0] : 0];
  }
  const formElement = document.querySelector('form')
  formElement.addEventListener("submit", (e) => {
    e.preventDefault();
    $table.bootstrapTable('removeAll');
    var income = Number(formElement.querySelector('input[name="income"]').value.replaceAll(",", "")) || 0;
    var married = formElement.querySelector('input[name="marriedRadios"]:checked').value === 'married';
    var dependents = Number($('#dependents').val()) || 0;
    var graphics = []
    if (income > 100000000) {
      alert("Sorry, you make too much money for this tool to be useful")
    }
    else {
      Object.entries(stateObj).forEach(([key, value], index) => {
        try {
          if (value.notax == true) {
            $table.bootstrapTable('insertRow', {
              index: index,
              row: {
                state: key.replace("_", " "),
                incomeAfterTaxes: income.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                grossDifference: 0,
                percentDifference: 0,
                medianIncome: value.medianIncome,
                educationLevel: value.educationLevel
              }
            })
            if (value.geometry) {
              let gfx = new Graphic({
                geometry: value.geometry,
                attributes: {
                  "Income_Before_Taxes": income.toString(),
                  "Income_After_Taxes": income.toString(),
                  "Total_State_Tax_Owed": 0,
                  "State_Abbr": value.abb,
                  "PercentOwed": 0,
                  "ObjectId": index
                }
              });
              graphics.push(gfx)
            }
          }
          else {
            let rateArr, rate = 0, bracket = 0, incomeWithExemptions = 0, taxBeforeCredits = 0, taxAfterCreditsRaw = 0, totalTax = 0, totalExemptions = 0, totalCredits = 0;
            if (married == true) {
              rateArr = getRate(value.married_brackets, income)
              rate = rateArr[0]
              bracket = rateArr[1]
              incomeWithExemptions = income - (value.SD_married || 0) - (value.married_exemption || 0) - ((value.dependent_exemption || 0) * dependents)
              taxBeforeCredits = incomeWithExemptions * rate
              taxAfterCreditsRaw = taxBeforeCredits - (value.married_credit || 0) - ((value.dependent_credit || 0) * dependents)
              totalTax = taxAfterCreditsRaw > 0 ? Math.trunc(taxAfterCreditsRaw) : 0
              totalExemptions = (value.SD_married || 0) + ((value.dependent_exemption || 0) * dependents) + (value.married_exemption || 0)
              totalCredits = ((value.dependent_credit || 0) * dependents) + (value.married_credit || 0)
            }
            else {
              rateArr = getRate(value.single_brackets, income)
              rate = rateArr[0]
              bracket = rateArr[1]
              incomeWithExemptions = income - (value.SD_single || 0) - (value.personal_exemption || 0) - ((value.dependent_exemption || 0) * dependents)
              taxBeforeCredits = incomeWithExemptions * rate
              taxAfterCreditsRaw = taxBeforeCredits - (value.personal_credit || 0) - ((value.dependent_credit || 0) * dependents)
              totalTax = taxAfterCreditsRaw > 0 ? Math.trunc(taxAfterCreditsRaw) : 0
              totalExemptions = (value.SD_single || 0) + ((value.dependent_exemption || 0) * dependents) + (value.personal_exemption || 0)
              totalCredits = ((value.dependent_credit || 0) * dependents) + (value.personal_credit || 0)
            }

            let percent = (income > 0) ? ((totalTax / income) * 100) : 0;
            $table.bootstrapTable('insertRow', {
              index: index,
              row: {
                state: key.replace("_", " "),
                bracket: (rate * 100).toFixed(2),
                incomeAfterTaxes: Math.trunc((income - totalTax)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                grossDifference: Math.trunc(totalTax).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                percentDifference: percent.toFixed(2),
                totalExemptions: Math.trunc(totalExemptions).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                totalCredits: Math.trunc(totalCredits).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                medianIncome: value.medianIncome,
                educationLevel: value.educationLevel
              }
            })
            value['incomeBeforeTaxes'] = Math.trunc(income)
            value['incomeAfterTaxes'] = Math.trunc((income - totalTax))
            value['grossDifference'] = Math.trunc(totalTax)
            value['percentDifference'] = percent
            value['bracket'] = (bracket !== undefined && bracket !== null) ? bracket.toString().replace("[", "").replace("]", "") : "0"
            if (value.geometry) {
              let gfx = new Graphic({
                geometry: value.geometry,
                attributes: {
                  "Income_Before_Taxes": value['incomeBeforeTaxes'],
                  "Income_After_Taxes": value['incomeAfterTaxes'],
                  "Total_State_Tax_Owed": value['grossDifference'],
                  "State_Abbr": value.abb,
                  "PercentOwed": Number(value['percentDifference']) || 0,
                  "ObjectId": index
                }
              });
              graphics.push(gfx)
            }
            $("th[data-field='percentDifference'] .sortable").click();
          }
        }
        catch (err) {
          console.error('Error processing state', key, err);
        }
      })
    }
    try {
      if (map.layers && map.layers.length) {
        map.layers.forEach(function (lyr) {
          if (lyr && (lyr.title === 'US States' || lyr.title === 'State Tax Layer')) {
            map.layers.remove(lyr);
          }
        });
      }
    } catch (err) {
      console.warn('Error removing previous layer:', err);
    }

    const noTax = { type: "simple-fill", color: "#0c7d3f", style: "solid", outline: { width: 0.2, color: [255, 255, 255, 0.5] } };
    const under3 = { type: "simple-fill", color: "#99bf47", style: "solid", outline: { width: 0.2, color: [255, 255, 255, 0.5] } };
    const threeToFive = { type: "simple-fill", color: "#d6a206", style: "solid", outline: { width: 0.2, color: [255, 255, 255, 0.5] } };
    const over5 = { type: "simple-fill", color: "#c42f02", style: "solid", outline: { width: 0.2, color: [255, 255, 255, 0.5] } };

    const renderer = {
      type: "class-breaks",
      field: "PercentOwed",
      legendOptions: { title: "Total Actual State Tax Owed" },
      defaultSymbol: { type: "simple-fill", color: "black", style: "backward-diagonal", outline: { width: 0.5, color: [50, 50, 50, 0.6] } },
      defaultLabel: "no data",
      classBreakInfos: [
        { minValue: 0, maxValue: 0, symbol: noTax, label: "No tax" },
        { minValue: 0.01, maxValue: 3, symbol: under3, label: "0 - 3%" },
        { minValue: 3, maxValue: 5, symbol: threeToFive, label: "3 - 5%" },
        { minValue: 5.01, maxValue: 100, symbol: over5, label: "more than 5%" }
      ]
    };
    if (!graphics || graphics.length === 0) {
      console.warn('No graphics to display as a layer — choropleth will not be added.');
      return;
    }
    const layer = new FeatureLayer({
      source: graphics,
      objectIdField: "ObjectId",
      title: "State Tax Layer",
      fields: [
        { name: "ObjectId", type: "oid" },
        { name: "Income_Before_Taxes", type: "double" },
        { name: "Income_After_Taxes", type: "double" },
        { name: "Total_State_Tax_Owed", type: "double" },
        { name: "PercentOwed", type: "double" },
        { name: "State_Abbr", type: "string" },
      ],
      popupTemplate: {
        content: "State: {State_Abbr} <br>" +
          "State tax as percent of income: %{PercentOwed} <br>" +
          "Total State Tax Owed: {Total_State_Tax_Owed} <br>" +
          "Income after states taxes: {Income_After_Taxes}"
      },
      renderer: renderer
    });
    map.add(layer);
  });
});