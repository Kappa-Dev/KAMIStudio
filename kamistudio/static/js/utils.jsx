/**
 * Collection of various js utils components for dialogs.
 */

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}


function singleValueToString(data, attr_name) {
	// convert value of an attribute to innerText/innerHtml
	var value = (attr_name in data) ? data[attr_name].data[0] : 
		<div className="small-faded">not specified</div>;
	return value;
};

function multipleValuesToString(data, attr_name) {
	// convert value of an attribute to innerText/innerHtml
	var value = (attr_name in data) ? value = data[attr_name].data.join(", ") : 
		<div className="small-faded">not specified</div>;
	return value;
};

function getSingleValue(data, attr_name) {
	return attr_name in data ? data[attr_name].data[0] : null;
};

function getMultipleValues(data, attr_name) {
	return attr_name in data ? data[attr_name].data : null;
};

function boolRepresentation(flag) {
	if (typeof flag === "string") {
		var els = flag.split(", "),
			newEls = [];
		for (var i = els.length - 1; i >= 0; i--) {
			if (els[i] === "true") {
				newEls.push("+");
			} else {
				newEls.push("-");
			}
		}
		return newEls.join(", ");
	} else {
		return flag ? "+" : "-";
	}
}


function generateNodeMetaDataItems(elementId, metaType, attrs, instantiated=false) {
	var message = "",
		items = [],
		data = {};

	if (!elementId) {
		message = "Click on an element to select";
	} else {
		if (metaType === "protoform") {
			var uniprot = singleValueToString(attrs, "uniprotid"),
				hgnc = singleValueToString(attrs, "hgnc_symbol"),
				synonyms = multipleValuesToString(attrs, "synonyms");
			items = [
				[
					"uniprotid",
					"UniProt AC",
					<a href={"https://www.uniprot.org/uniprot/" + uniprot}>
						{uniprot}
					</a>
				],
				["hgnc_symbol", "HGNC Symbol", hgnc],
				["synonyms", "Synonyms", synonyms],
			];
			data["uniprotid"] = getSingleValue(attrs, "uniprotid");
			data["hgnc_symbol"] = getSingleValue(attrs, "hgnc_symbol");
			data["synonyms"] = getMultipleValues(attrs, "synonyms");

			if (instantiated) {
				var variantName = singleValueToString(attrs, "variant_name"),
					variantDesc = singleValueToString(attrs, "variant_desc")

				items.push([
					"variane_name", "Variant name", variantName]);
				items.push([
					"variane_desc", "Variant description", variantDesc]);

				data["variant_name"] = getSingleValue(attrs, "variant_name");
				data["variant_desc"] = getSingleValue(attrs, "variant_desc");
			}

		} else if ((metaType === "region") || (metaType === "site")) {
			var name = multipleValuesToString(attrs, "name");

			var interpros = [], interproValue;
			if ("interproid" in attrs) {
				for (var i = attrs["interproid"].data.length - 1; i >= 0; i--) {
					interproValue = attrs["interproid"].data[i];
				 	if (interproValue[0] != "I") {
						interpros.push(interproValue);
					} else {
						interpros.push(
							<a href={"http://www.ebi.ac.uk/interpro/entry/" + interproValue}>
								{interproValue}
							</a>);
					}
					if (i != 0) {
						interpros.push(", ");
					}
				 } 
			}

			items = [
				["name", "Name", name],
				["interproid", "InterPro ID", interpros]
			];
			data["interproid"] = getMultipleValues(attrs, "interproid");
			data["name"] = getMultipleValues(attrs, "name");
		} else if (metaType === "residue") {
			var aa = multipleValuesToString(attrs, "aa"),
				test = multipleValuesToString(attrs, "test");
			items = [
				["aa", "Amino Acid", aa],
				["test", "Test", boolRepresentation(test)]
			];
			data["aa"] = getMultipleValues(attrs, "aa");
			data["test"] = getMultipleValues(attrs, "test");
		} else if (metaType === "state") {
			var name = singleValueToString(attrs, "name"),
				test = singleValueToString(attrs, "test");
			items = [
				["name", "Name", name],
				["test", "Test", boolRepresentation(test)]
			];
			data["name"] = getSingleValue(attrs, "name");
			data["test"] = getSingleValue(attrs, "test");
		} else if (metaType === "mod") {
			var value = singleValueToString(attrs, "value"),
				rate = singleValueToString(attrs, "rate");
			items = [
				["value", "Value", boolRepresentation(value)],
				["rate", "Rate", rate],
			];
			data["value"] = getSingleValue(attrs, "value");
			data["rate"] = getSingleValue(attrs, "rate");
		} else if (metaType === "bnd") {
			var rate = singleValueToString(attrs, "rate"),
				test = multipleValuesToString(attrs, "test"),
				type = multipleValuesToString(attrs, "type");
			items = [
				["rate", "Rate", rate],
				["test", "Test", boolRepresentation(test)],
				["type", "Type", type]
			];
			data["rate"] = getSingleValue(attrs, "rate"),
			data["test"] = getMultipleValues(attrs, "test");
			data["type"] = getMultipleValues(attrs, "type");
		} else {
			message = "No meta-data available";
		}
	}
	return [message, items, data];
}

function generateEdgeMetaDataItems(sourceId, targetId,
								   sourceMetaType, targetMetaType, attrs) {
	var message = "",
		items = [],
		data = {};
	if ((!sourceId) || (!targetId)) {
		message = "Click on an element to select";
	} else {
		//  region/gene, site/gene, site/region
		if (((sourceMetaType === "region") && (targetMetaType === "protoform")) ||
			((sourceMetaType === "site") && (targetMetaType === "protoform")) ||
			((sourceMetaType === "site") && (targetMetaType === "region"))) {
			var start = singleValueToString(attrs, "start"),
				end = singleValueToString(attrs, "end"),
				order = singleValueToString(attrs, "order");
			items = [
				["start", "Start", start],
				["end", "End", end],
				["order", "Order", order]
			];
			data["start"] = getSingleValue(attrs, "start");
			data["end"] = getSingleValue(attrs, "end");
			data["order"] = getSingleValue(attrs, "order");
		} else if (sourceMetaType === "residue")  {
			var loc = singleValueToString(attrs, "loc");
			items = [
				["loc", "Location", loc]
			];
			data["loc"] = getSingleValue(attrs, "loc");
		} else {
			message = "Not available for this element"
		}
	}
	return [message, items, data];
}

$('tr').click( function() {
    window.location = $(this).find('a').attr('href');
}).hover( function() {
    $(this).toggleClass('hover');
});
