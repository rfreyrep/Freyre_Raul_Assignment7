/* globals feather:false, stateObj:false */

(() => {
  'use strict';

  if (feather) feather.replace({ 'aria-hidden': 'true' });

  const $table = $('#table');

  if ($table && $table.length) {
    $table.bootstrapTable();
  }

  function renderTable() {
    if (!$table || !$table.length) return;

    Object.entries(stateObj).forEach(([key, value]) => {
      const educationValue = value.educationPct ? value.educationPct.toFixed(2) + '%' : '-';
      const row = $table.bootstrapTable('getData').find(r => r.state === key.replace("_", " "));
      if (row) {
        row.educationPct = educationValue;
      } else {
        $table.bootstrapTable('insertRow', {
          index: 0,
          row: {
            state: key.replace("_", " "),
            educationPct: educationValue
          }
        });
      }
    });

    $table.bootstrapTable('load', $table.bootstrapTable('getData'));
    console.log('Education column added to dashboard.');
  }

  setTimeout(renderTable, 4000);
})();
