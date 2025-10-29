# README

This project uses an interactive dashboard built with HTML, JavaScript, and the ArcGIS API to display information about U.S. states using data from the American Community Survey (ACS).

Following the professor's steps, the following tasks were completed:

1. New ACS dataset:

   A dataset called Educational Attainment (Adults 25+) from 2010–2014 was selected from the ArcGIS Data Services.  
   URL used:  
   https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/ACS_10_14_Educational_Attainment_Boundaries/FeatureServer/0  

2. New FeatureLayer:  
   A new layer named educationLayer was created using that URL. This layer allows the app to access education level data at the state level.

3. Function loadEducationData():  
   A new function was written similar to loadAdditionalData(). It queries all records from the service, matches states using the STUSPS field, and saves the education value in stateObj[stateKey].educationLevel.

4. Bootstrap Table column: 
   A new column named “Education Level” was added to the Bootstrap Table so that the education data can be displayed together with the state tax and median income data.

While testing the dataset, many values appeared as null in the JSON section of the ArcGIS service. Because of that, they do not show up in the final map or table.

Although:

 The code is valid, well-structured, and functional.  
 Once the dataset values are updated or replaced with a more complete ACS dataset, the data will automatically appear in the Bootstrap Table without needing to modify the code.
