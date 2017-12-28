/*
This file is part of Natural Docs, which is Copyright © 2003-2017 Code Clear LLC.
Natural Docs is licensed under version 3 of the GNU Affero General Public
License (AGPL).  Refer to License.txt or www.naturaldocs.org for the
complete details.

This file may be distributed with documentation files generated by Natural Docs.
Such documentation is not covered by Natural Docs' copyright and licensing,
and may have its own copyright and distribution terms as decided by its author.
*/

"use strict";var NDSearch=new function(){this.Start=function(){this.domSearchField=document.getElementById("NDSearchField");this.domResults=document.createElement("div");this.domResults.id="NDSearchResults";this.domResults.style.display="none";this.domResults.style.position="fixed";if(NDCore.IEVersion()==6){this.domResults.style.position="absolute";}this.domResultsContent=document.createElement("div");this.domResultsContent.id="SeContent";this.domResults.appendChild(this.domResultsContent);document.body.appendChild(this.domResults);this.initialTimeoutStatus=1;this.topLevelEntryCount=0;this.visibleEntryCount=0;this.openParents=[];this.keyboardSelectionIndex=-1;this.moreResultsThreshold=25;this.allPrefixesStatus=1;this.prefixObjects={};this.domSearchField.onfocus=function(){NDSearch.OnSearchFieldFocus();};this.domSearchField.onkeydown=function(event){NDSearch.OnSearchFieldKey(event);};if(NDCore.SupportsOnInput()){this.domSearchField.oninput=function(event){NDSearch.OnSearchFieldChange(event);};}else{this.domSearchField.oncut=function(event){NDSearch.OnSearchFieldChange(event);};this.domSearchField.onpaste=function(event){NDSearch.OnSearchFieldChange(event);};}this.domResults.onfocus=function(){NDSearch.OnResultsFocus();};this.DeactivateSearchField();};this.Update=function(){if(!this.SearchFieldIsActive()){return;}var searchInterpretations=this.GetSearchInterpretations();if(searchInterpretations.length==0){this.ClearResults();return;}if(this.allPrefixesStatus!=3){this.ClearResults(true);this.domResultsContent.innerHTML=this.BuildSearchingStatus();this.ShowResults();return;}var searchInterpretationPrefixes=this.GetMatchingPrefixes(searchInterpretations);this.RemoveUnusedPrefixObjects(searchInterpretationPrefixes);if(searchInterpretationPrefixes.length==0){this.ClearResults(true);this.domResultsContent.innerHTML=this.BuildNoMatchesStatus();this.ShowResults();return;}var location=new NDLocation(window.location.hash);var favorClasses=(location.type=="Class"||location.type=="Database");var forceExpansion=(this.TotalMatchesGreaterThan(searchInterpretations,searchInterpretationPrefixes,10)===false);var buildResults=this.BuildResults(searchInterpretations,searchInterpretationPrefixes,favorClasses,forceExpansion);var oldScrollTop=this.domResults.scrollTop;this.domResultsContent.innerHTML=buildResults.html;this.ShowResults();this.domResults.scrollTop=oldScrollTop;if(this.keyboardSelectionIndex!=-1){var domSelectedEntry=document.getElementById("SeSelectedEntry");if(domSelectedEntry!=undefined){this.ScrollEntryIntoView(domSelectedEntry,false);}}if(buildResults.prefixDataToLoad!=undefined){this.LoadPrefixData(buildResults.prefixDataToLoad);}};this.ClearResults=function(internalOnly){if(this.updateTimeout!=undefined){clearTimeout(this.updateTimeout);this.updateTimeout=undefined;}if(this.initialTimeout!=undefined){clearTimeout(this.initialTimeout);this.initialTimeout=undefined;}this.initialTimeoutStatus=1;if(!internalOnly){this.HideResults();}this.visibleEntryCount=0;this.topLevelEntryCount=0;this.openParents=[];this.keyboardSelectionIndex=-1;this.moreResultsThreshold=25;this.prefixObjects={};};this.ToggleParent=function(topLevelIndex,fromKeyboard){var openParentsIndex=this.openParents.indexOf(topLevelIndex);var opening=(openParentsIndex==-1);if(opening){this.openParents.push(topLevelIndex);}else{this.openParents.splice(openParentsIndex,1);}if(!fromKeyboard){this.keyboardSelectionIndex=-1;this.domSearchField.focus();}this.Update();if(opening){var children=this.domResultsContent.children;var topLevelCount=0;var domToggledElement=undefined;for(var i=0;i<children.length;i++){if(NDCore.HasClass(children[i],"SeEntry")){if(topLevelCount==topLevelIndex){domToggledElement=children[i];break;}else{topLevelCount++;}}}if(domToggledElement!=undefined){this.ScrollEntryIntoView(domToggledElement,true);}}if(navigator.userAgent.indexOf("KHTML")!=-1&&this.domResults.scrollTop>0){this.domResults.scrollTop--;}};this.LoadMoreResults=function(){this.moreResultsThreshold=this.visibleEntryCount+25;this.domSearchField.focus();this.Update();};this.ActivateLinkFromKeyboard=function(domLink){var address=domLink.getAttribute("href");if(address.substr(0,11)=="javascript:"){address=address.substr(11);address=address.replace(/^(NDSearch.ToggleParent\([0-9]+,)false(.*)$/,"$1true$2");eval(address);}else{location.href=address;}};this.OnSearchFieldFocus=function(){if(!this.SearchFieldIsActive()){this.ActivateSearchField();if(this.allPrefixesStatus==1){this.allPrefixesStatus=2;NDCore.LoadJavaScript("search/index.js");}}};this.OnSearchFieldKey=function(event){if(event===undefined){event=window.event;}if(event.keyCode==27){this.ClearResults();this.DeactivateSearchField();document.getElementById("CFrame").contentWindow.focus();}else if(event.keyCode==38){if(this.keyboardSelectionIndex<=0){this.keyboardSelectionIndex=this.visibleEntryCount-1;}else{this.keyboardSelectionIndex--;}this.UpdateSelection();}else if(event.keyCode==40){if(this.visibleEntryCount==0){this.keyboardSelectionIndex=-1;}else if(this.keyboardSelectionIndex>=this.visibleEntryCount-1){this.keyboardSelectionIndex=0;}else{this.keyboardSelectionIndex++;}this.UpdateSelection();}else if(event.keyCode==37){if(this.keyboardSelectionIndex!=-1){var domSelectedEntry=document.getElementById("SeSelectedEntry");if(NDCore.HasClass(domSelectedEntry,"SeParent")&&NDCore.HasClass(domSelectedEntry,"open")){this.ActivateLinkFromKeyboard(domSelectedEntry);}}}else if(event.keyCode==39){if(this.keyboardSelectionIndex!=-1){var domSelectedEntry=document.getElementById("SeSelectedEntry");if(NDCore.HasClass(domSelectedEntry,"SeParent")&&NDCore.HasClass(domSelectedEntry,"closed")){this.ActivateLinkFromKeyboard(domSelectedEntry);}}}else if(event.keyCode==13){var domSelectedEntry=undefined;if(this.keyboardSelectionIndex!=-1){domSelectedEntry=document.getElementById("SeSelectedEntry");}else if(this.visibleEntryCount==1){domSelectedEntry=this.domResultsContent.firstChild;}else if(this.visibleEntryCount==2&&NDCore.HasClass(this.domResultsContent.firstChild,"SeParent")){domSelectedEntry=this.domResultsContent.childNodes[1].firstChild;}if(domSelectedEntry!=undefined){this.ActivateLinkFromKeyboard(domSelectedEntry);}else if(this.keyboardSelectionIndex==-1&&this.visibleEntryCount>0){this.keyboardSelectionIndex=0;this.UpdateSelection();}}else if(NDCore.SupportsOnInput()==false){if(event.keyCode!=37&&event.keyCode!=39){this.OnSearchFieldChange(event);}}};this.OnSearchFieldChange=function(event){if(event===undefined){event=window.event;}this.keyboardSelectionIndex=-1;if(this.initialTimeoutStatus==3){if(this.updateTimeout==undefined){this.updateTimeout=setTimeout(function(){clearTimeout(NDSearch.updateTimeout);NDSearch.updateTimeout=undefined;NDSearch.Update();},350);}}else{var searchInterpretations=this.GetSearchInterpretations();if(searchInterpretations.length!=0&&this.allPrefixesStatus==3&&this.GetMatchingPrefixes(searchInterpretations).length<=1){if(this.initialTimeoutStatus==2){clearTimeout(this.initialTimeout);this.initialTimeout=undefined;}this.initialTimeoutStatus=3;this.Update();}else if(this.initialTimeoutStatus==1){this.initialTimeoutStatus=2;this.initialTimeout=setTimeout(function(){if(NDSearch.initialTimeoutStatus==2){clearTimeout(NDSearch.initialTimeout);NDSearch.initialTimeout=undefined;NDSearch.initialTimeoutStatus=3;NDSearch.Update();}},1250);}}};this.OnResultsFocus=function(){this.domSearchField.focus();};this.OnUpdateLayout=function(){if(this.domResults!=undefined){this.PositionResults();if(this.keyboardSelectionIndex!=-1){var domSelectedEntry=document.getElementById("SeSelectedEntry");if(domSelectedEntry!=undefined){this.ScrollEntryIntoView(domSelectedEntry,false);}}}};this.GetSearchInterpretations=function(){var interpretations=[];var normalizedSearchText=this.domSearchField.value.toLowerCase();normalizedSearchText=normalizedSearchText.replace(/\s+/g," ");normalizedSearchText=normalizedSearchText.replace(/^ /,"");normalizedSearchText=normalizedSearchText.replace(/ $/,"");normalizedSearchText=normalizedSearchText.replace(/([^a-z0-9_]) /g,"$1");normalizedSearchText=normalizedSearchText.replace(/ (?=[^a-z0-9_])/g,"");normalizedSearchText=normalizedSearchText.replace(/::|->/g,".");normalizedSearchText=normalizedSearchText.replace(/\\/g,"/");normalizedSearchText=normalizedSearchText.replace(/^[./]+/,"");if(normalizedSearchText==""){return interpretations;}interpretations.push(normalizedSearchText);var lastChar=normalizedSearchText.charAt(normalizedSearchText.length-1);if(lastChar==":"||lastChar=="-"){interpretations.push(normalizedSearchText.substr(0,normalizedSearchText.length-1)+".");}return interpretations;};this.GetMatchingPrefixes=function(searchTextArray){var matchingPrefixes=[];if(this.allPrefixesStatus!=3){return matchingPrefixes;}for(var i=0;i<searchTextArray.length;i++){var searchText=searchTextArray[i];var searchPrefix=this.MakePrefix(searchText);if(searchPrefix!=undefined&&searchPrefix!=""){var prefixIndex=this.GetAllPrefixesIndex(searchPrefix);while(prefixIndex<this.allPrefixes.length){if(this.allPrefixes[prefixIndex].length>=searchPrefix.length&&this.allPrefixes[prefixIndex].substr(0,searchPrefix.length)==searchPrefix){matchingPrefixes.push(this.allPrefixes[prefixIndex]);prefixIndex++;}else{break;}}}}if(searchTextArray.length<=1){return matchingPrefixes;}matchingPrefixes.sort();for(var i=1;i<matchingPrefixes.length;){if(matchingPrefixes[i]==matchingPrefixes[i-1]){matchingPrefixes.splice(i,1);}else{i++;}}return matchingPrefixes;};this.GetAllPrefixesIndex=function(prefix){if(this.allPrefixesStatus!=3){return undefined;}if(this.allPrefixes.length==0){return 0;}var firstIndex=0;var lastIndex=this.allPrefixes.length-1;for(;;){var testIndex=(firstIndex+lastIndex)>>1;if(prefix==this.allPrefixes[testIndex]){return testIndex;}else if(prefix<this.allPrefixes[testIndex]){if(testIndex==firstIndex){return testIndex;}else{lastIndex=testIndex;}}else{if(testIndex==lastIndex){return lastIndex+1;}else{firstIndex=testIndex+1;}}}};this.KeywordMatchesInterpretations=function(keywordObject,interpretations){for(var i=0;i<interpretations.length;i++){var interpretation=interpretations[i];if(interpretation.length<=keywordObject[1].length){if(keywordObject[1].indexOf(interpretation)!=-1){return true;}}else{if(interpretation.indexOf(keywordObject[1])!=-1){return true;}}}return false;};this.MemberMatchesInterpretations=function(memberObject,interpretations){for(var i=0;i<interpretations.length;i++){var interpretation=interpretations[i];if(memberObject[3].indexOf(interpretation)!=-1){return true;}}return false;};this.TotalMatchesGreaterThan=function(searchInterpretations,searchInterpretationPrefixes,maximum){var totalMatches=0;for(var p=0;p<searchInterpretationPrefixes.length;p++){var prefix=searchInterpretationPrefixes[p];if(this.prefixObjects[prefix]==undefined||this.prefixObjects[prefix][2]==false){return undefined;}var keywordObjects=this.prefixObjects[prefix][1];for(var k=0;k<keywordObjects.length;k++){var keywordObject=keywordObjects[k];if(this.KeywordMatchesInterpretations(keywordObject,searchInterpretations)){var memberObjects=keywordObject[2];for(var m=0;m<memberObjects.length;m++){var memberObject=memberObjects[m];if(this.MemberMatchesInterpretations(memberObject,searchInterpretations)){totalMatches++;if(totalMatches>maximum){return true;}}}}}}return false;};this.BuildResults=function(searchInterpretations,searchInterpretationPrefixes,favorClasses,forceExpansion){var results={html:""};this.topLevelEntryCount=0;this.visibleEntryCount=0;var addSearchingStatus=false;for(var p=0;p<searchInterpretationPrefixes.length;p++){var prefix=searchInterpretationPrefixes[p];if(this.prefixObjects[prefix]==undefined){if(this.visibleEntryCount<this.moreResultsThreshold){results.prefixDataToLoad=prefix;addSearchingStatus=true;}else{results.html+=this.BuildMoreResultsEntry();}break;}else if(this.prefixObjects[prefix][2]==false){addSearchingStatus=true;break;}var keywordObjects=this.prefixObjects[prefix][1];for(var k=0;k<keywordObjects.length;k++){results.html+=this.BuildKeyword(keywordObjects[k],searchInterpretations,favorClasses,forceExpansion);}}if(addSearchingStatus){results.html+=this.BuildSearchingStatus();}else if(results.html==""){results.html+=this.BuildNoMatchesStatus();}return results;};this.BuildKeyword=function(keywordObject,searchInterpretations,favorClasses,forceExpansion){if(this.KeywordMatchesInterpretations(keywordObject,searchInterpretations)==false){return"";}var memberMatches=0;var lastMatchingMemberObject;for(var i=0;i<keywordObject[2].length;i++){var memberObject=keywordObject[2][i];if(this.MemberMatchesInterpretations(memberObject,searchInterpretations)){lastMatchingMemberObject=memberObject;memberMatches++;}}if(memberMatches==0){return"";}else if(memberMatches==1&&lastMatchingMemberObject[3]==keywordObject[1]){var selected=(this.keyboardSelectionIndex==this.visibleEntryCount);var commentType=lastMatchingMemberObject[4];var target;if(favorClasses&&lastMatchingMemberObject[6]!=undefined){target=lastMatchingMemberObject[6];}else{target=lastMatchingMemberObject[5];}var html="<a class=\"SeEntry T"+commentType+"\" "+(selected?"id=\"SeSelectedEntry\" ":"")+"href=\"#"+target+"\">"+"<div class=\"SeEntryIcon\"></div>"+lastMatchingMemberObject[1];if(lastMatchingMemberObject[0]!=undefined||lastMatchingMemberObject[2]!=undefined){html+="<span class=\"SeQualifier\">";if(lastMatchingMemberObject[0]!=undefined){html+=", "+lastMatchingMemberObject[0];}if(lastMatchingMemberObject[2]!=undefined){html+=", "+lastMatchingMemberObject[2];}html+="</span>";}html+="</a>";this.topLevelEntryCount++;this.visibleEntryCount++;return html;}else{var selected=(this.keyboardSelectionIndex==this.visibleEntryCount);var openClosed;if(forceExpansion||this.openParents.indexOf(this.topLevelEntryCount)!=-1){openClosed="open";}else{openClosed="closed";}var html="<a class=\"SeEntry SeParent "+openClosed+"\" "+(selected?"id=\"SeSelectedEntry\" ":"")+"href=\"javascript:NDSearch.ToggleParent("+this.topLevelEntryCount+",false)\">"+"<div class=\"SeEntryIcon\"></div>"+keywordObject[0]+" <span class=\"SeChildCount\">("+memberMatches+")</span>"+"</a>";this.topLevelEntryCount++;this.visibleEntryCount++;if(openClosed=="open"){html+="<div class=\"SeChildren\">";for(var i=0;i<keywordObject[2].length;i++){var memberObject=keywordObject[2][i];if(this.MemberMatchesInterpretations(memberObject,searchInterpretations)){var selected=(this.keyboardSelectionIndex==this.visibleEntryCount);var commentType=memberObject[4];var target;if(favorClasses&&memberObject[6]!=undefined){target=memberObject[6];}else{target=memberObject[5];}html+="<a class=\"SeEntry T"+commentType+"\" "+(selected?"id=\"SeSelectedEntry\" ":"")+"href=\"#"+target+"\">"+"<div class=\"SeEntryIcon\"></div>"+memberObject[1];if(memberObject[0]!=undefined||memberObject[2]!=undefined){html+="<span class=\"SeQualifier\">";if(memberObject[0]!=undefined){html+=", "+memberObject[0];}if(memberObject[2]!=undefined){html+=", "+memberObject[2];}html+="</span>";}html+="</a>";this.visibleEntryCount++;}}html+="</div>";}return html;}};this.BuildSearchingStatus=function(){return"<div class=\"SeStatus Searching\">"+"Searching..."+"</div>";};this.BuildNoMatchesStatus=function(){return"<div class=\"SeStatus NoResults\">"+"No Matches"+"</div>";};this.BuildMoreResultsEntry=function(){var selected=(this.keyboardSelectionIndex==this.visibleEntryCount);var html="<a class=\"SeEntry MoreResults\" "+(selected?"id=\"SeSelectedEntry\" ":"")+"href=\"javascript:NDSearch.LoadMoreResults();\">"+"<div class=\"SeEntryIcon\"></div>"+"More Results..."+"</a>";this.visibleEntryCount++;this.topLevelEntryCount++;return html;};this.MakePrefix=function(searchText){var prefix="";for(var i=0;i<3;i++){if(i>=searchText.length){break;}var char=searchText.charAt(i);if(char==" "||char=="."||char=="/"){break;}prefix+=char;}if(prefix.length>0){return prefix;}else{return undefined;}};this.PrefixToHex=function(prefix){var hex="";for(var i=0;i<prefix.length;i++){var charValue="0000"+prefix.charCodeAt(i).toString(16);hex+=charValue.substr(charValue.length-4,4);}return hex;};this.PrefixToDataFile=function(prefix){return"search/keywords/"+this.PrefixToHex(prefix)+".js";};this.ActivateSearchField=function(){this.domSearchField.value="";NDCore.RemoveClass(this.domSearchField,"DefaultText");};this.DeactivateSearchField=function(){NDCore.AddClass(this.domSearchField,"DefaultText");this.domSearchField.value="Search";};this.SearchFieldIsActive=function(){return(NDCore.HasClass(this.domSearchField,"DefaultText")==false);};this.ShowResults=function(){this.domResults.style.display="block";this.PositionResults();};this.HideResults=function(){this.domResults.style.display="none";};this.PositionResults=function(){this.domResults.style.visibility="hidden";var oldScrollTop=this.domResults.scrollTop;NDCore.SetToAbsolutePosition(this.domResults,0,0,undefined,undefined);this.domResults.style.width="";this.domResults.style.height="";var urX=this.domSearchField.offsetLeft+this.domSearchField.offsetWidth;var urY=this.domSearchField.offsetTop+this.domSearchField.offsetHeight+5;var footer=document.getElementById("NDFooter");var maxWidth=urX;var maxHeight=NDCore.WindowClientHeight()-urY-(footer.offsetHeight*2);if(this.domResults.offsetHeight>maxHeight){NDCore.SetToAbsolutePosition(this.domResults,undefined,undefined,undefined,maxHeight);}if(this.domResults.offsetWidth>maxWidth){NDCore.SetToAbsolutePosition(this.domResults,undefined,undefined,maxWidth,undefined);}else{if(this.domResults.scrollWidth>this.domResults.clientWidth){var newWidth=this.domResults.offsetWidth+(this.domResults.scrollWidth-this.domResults.clientWidth)+5;if(newWidth>maxWidth){newWidth=maxWidth;}NDCore.SetToAbsolutePosition(this.domResults,undefined,undefined,newWidth,undefined);}if(this.domResults.offsetWidth<this.domSearchField.offsetWidth){NDCore.SetToAbsolutePosition(this.domResults,undefined,undefined,this.domSearchField.offsetWidth,undefined);}}NDCore.SetToAbsolutePosition(this.domResults,urX-this.domResults.offsetWidth,urY,undefined,undefined);this.domResults.scrollTop=oldScrollTop;this.domResults.style.visibility="visible";};this.UpdateSelection=function(){var domCurrentSelection=document.getElementById("SeSelectedEntry");var domNewSelection=undefined;if(this.keyboardSelectionIndex!=-1){domNewSelection=NDCore.GetElementsByClassName(this.domResultsContent,"SeEntry","a")[this.keyboardSelectionIndex];}if(domCurrentSelection!=undefined){domCurrentSelection.id=undefined;}if(domNewSelection!=undefined){domNewSelection.id="SeSelectedEntry";this.ScrollEntryIntoView(domNewSelection,false);}};this.ScrollEntryIntoView=function(domEntry,includeChildren){var itemTop=domEntry.offsetTop;var itemBottom;if(includeChildren&&NDCore.HasClass(domEntry,"open")){var domSelectedChildren=domEntry.nextSibling;itemBottom=domSelectedChildren.offsetTop+domSelectedChildren.offsetHeight;}else{itemBottom=itemTop+domEntry.offsetHeight;}var windowTop=this.domResults.scrollTop;var windowBottom=windowTop+this.domResults.clientHeight;var offset=0;if(windowBottom<itemBottom){offset=itemBottom-windowBottom;}if(windowTop+offset>itemTop){offset=itemTop-windowTop;}if(offset!=0){this.domResults.scrollTop+=offset;}};this.OnPrefixIndexLoaded=function(prefixes){this.allPrefixes=prefixes;this.allPrefixesStatus=3;if(this.initialTimeoutStatus==3){this.Update();}};this.LoadPrefixData=function(prefix){if(this.prefixObjects[prefix]==undefined){var prefixObject=[];prefixObject[0]=prefix;prefixObject[2]=false;prefixObject[3]="NDPrefixLoader_"+this.PrefixToHex(prefix);this.prefixObjects[prefix]=prefixObject;NDCore.LoadJavaScript(this.PrefixToDataFile(prefix),prefixObject[3]);}};this.OnPrefixDataLoaded=function(prefix,commentTypes,keywordObjects){var prefixObject=this.prefixObjects[prefix];if(prefixObject==undefined){return;}for(var k=0;k<keywordObjects.length;k++){var keywordObject=keywordObjects[k];if(keywordObject[1]==undefined){keywordObject[1]=keywordObject[0].toLowerCase();}for(var m=0;m<keywordObject[2].length;m++){var memberObject=keywordObject[2][m];var commentTypeIndex=memberObject[4];memberObject[4]=commentTypes[commentTypeIndex];if(memberObject[1]==undefined){memberObject[1]=keywordObject[0];}if(memberObject[3]==undefined){memberObject[3]=memberObject[1].toLowerCase();}}}prefixObject[1]=keywordObjects;prefixObject[2]=true;NDCore.RemoveScriptElement(prefixObject[3]);this.Update();};this.RemoveUnusedPrefixObjects=function(usedPrefixes){if(usedPrefixes.length==0){this.prefixObjects={};return;}for(var prefix in this.prefixObjects){if(usedPrefixes.indexOf(prefix)==-1){this.prefixObjects[prefix]=undefined;}}};};