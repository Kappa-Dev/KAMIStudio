var UNIPROT_URL_PREFIX = "https://www.uniprot.org/uniprot/";
var INTERPRO_URL_PREFIX = "http://www.ebi.ac.uk/interpro/entry/";


function singleValueToString(data, attr_name) {
	// convert value of an attribute to innerText/innerHtml
	var value = "";
	console.log(attr_name, data, attr_name in data);
	if (attr_name in data) {
		value = data[attr_name];
	} else {
		value = '<p class="faded">not specified</p>';
	}

	return value;
}


function generateMetaDataTrs(nodeType, data) {
	console.log(data);
	if (nodeType == "gene") {
		trs = 
			'    <tr>\n' +
		    '      <td><b>UniProt AC:</b></td>\n';
		if ("uniprotid" in data) {
			trs += 
				'      <td id="uniprotidTD"><a href="https://www.uniprot.org/uniprot/' + singleValueToString(data, "uniprotid") + '">' + singleValueToString(data, "uniprotid") + '</a></td>\n';
		} else {
			trs += 
				'      <td id="uniprotidTD"><p class="faded">not specified</p></td>\n';
		} 
		trs +=
		    '    </tr>\n' +
		    '    <tr>\n' +
		    '      <td><b>HGNC Symbol:</b></td>\n' +
		    '      <td id="hgncSymbolTD">' + singleValueToString(data, "hgnc_symbol") + '</td>\n' +
		    '    </tr>\n' +
		    '    <tr>\n' +
		    '      <td><b>Synonyms: </b></td>\n' +
		    '      <td id="synonymsTD">' + singleValueToString(data, "synonyms") + '</td>\n' +
		    '    </tr>\n';
	} else if ((nodeType == "region") || (nodeType == "site")) {
		trs = 
          '    <tr>\n' +
          '      <td><b>Name:</b></td>\n' +
          '      <td id="nameTD">' + singleValueToString(data, "name") + '</td>\n' +
          '    </tr>\n' +
          '    <tr>\n' +
          '      <td><b>InterPro ID:</b></td>\n';

        var interProValue = singleValueToString(data, "interproid");
        if (interProValue[0] != "I") {
          trs += '<td id="interproIdTD">' + interProValue + '</td>\n';
        } else {
          trs +=
            '<td id="interproIdTD"><a href="http://www.ebi.ac.uk/interpro/entry/' + singleValueToString(data, "interproid") + '">' + singleValueToString(data, "interproid") + '</a></td>\n';
        }
        trs += '    </tr>\n';
	} else if (nodeType == "residue") {
		trs = 
		  '    <tr>\n' +
          '      <td><b>Amino Acid:</b></td>\n' +
          '      <td id="aaTD">' + singleValueToString(data, "aa") + '</td>\n' +
          '    </tr>\n' +
          '    <tr>\n' +
          '      <td><b>Test:</b></td>\n' +
          '      <td id="testTD">' + singleValueToString(data, "test") + '</td>\n' +
          '    </tr>\n';
	} else if (nodeType == "state") {
		trs = 
		  '    <tr>\n' +
          '      <td><b>Name:</b></td>\n' +
          '      <td id="nameTD">' + singleValueToString(data, "name") + '</td>\n' +
          '    </tr>\n' +
          '    <tr>\n' +
          '      <td><b>Test:</b></td>\n' +
          '      <td id="testTD">' + singleValueToString(data, "test") + '</td>\n' +
          '    </tr>\n';
	} else if (nodeType == "mod") {
		trs =
			'    <tr>\n' +
	        '      <td><b>Value:</b></td>\n' +
	        '      <td id="valueTD">' + singleValueToString(data, "value") + '</td>\n' +
	        '    </tr>\n' +
	        '    <tr>\n' +
	        '      <td><b>Rate:</b></td>\n' +
	        '      <td id="rateTD">' + singleValueToString(data, "rate") + '</td>\n' +
	        '    </tr>\n' +
	    	'    <tr>\n' +
	        '      <td><b>Description:</b></td>\n' +
	        '      <td id="descTD">' + singleValueToString(data, "desc") + '</td>\n' +
	        '    </tr>\n';
	} else if (nodeType == "bnd") {
		trs =
			'    <tr>\n' +
	        '      <td><b>Rate:</b></td>\n' +
	        '      <td id="rateTD">' + singleValueToString(data, "rate") + '</td>\n' +
	        '    </tr>\n' +
	        '    <tr>\n' +
	        '      <td><b>Description:</b></td>\n' +
	        '      <td id="descTD">' + singleValueToString(data, "desc") + '</td>\n' +
	        '    </tr>\n';
	}
    return trs;
}