function renderMetaDataBox(modelId, data, oldData) {

	var name = ("name" in data) ? data["name"][0] : oldData["name"],
	 	desc = ("desc" in data) ? data["desc"][0] : oldData["desc"],
	 	organism = ("organism" in data) ? data["organism"][0] : oldData["organism"];

    ReactDOM.render(
      <KBMetaDataBox
			id="modelMetaData"
			name="Meta-data"
			editable={true}
			kbName={name}
			desc={desc}
			organism={organism}
			creation_time={oldData["creation_time"]}
			last_modified={oldData["last_modified"]}
			protected={["creation_time", "last_modified"]}
			instantiated={true}
			onDataUpdate={handleModelUpdate(modelId)}/>,
      document.getElementById('modelMetaData')
    );
};

function sendMetaDataUpdate(modelId, data) {
	if ("name" in data) {
		data["name"] = data["name"][0];
	}
	if ("desc" in data) {
		data["desc"] = data["desc"][0];
	}
	if ("organism" in data) {
		data["organism"] = data["organism"][0];
	}

	$.ajax({
	    url:  modelId + "/update-meta-data",
	    type: 'post',
	    data: JSON.stringify(data),
	    dataType: 'json',
    	contentType: 'application/json',
	}).done(function () {
		// if (successCallback) successCallback();
	}).fail(function (xhr, status, error) {
		console.log("Failed send the request");
		console.log(error);
		// if (failCallback) failCallback();
	});
};



function handleModelUpdate(modelId) {
	return function(data, oldData) {
		renderMetaDataBox(modelId, data, oldData);
		sendMetaDataUpdate(modelId, data);
	}
};


function renderRateDataBox(modelId, data, oldData, readonly) {
	var default_bnd_rate = ("default_bnd_rate" in data) ? data["default_bnd_rate"][0] : oldData["default_bnd_rate"],
	 	default_brk_rate = ("default_brk_rate" in data) ? data["default_brk_rate"][0] : oldData["default_brk_rate"],
	 	default_mod_rate = ("default_mod_rate" in data) ? data["default_mod_rate"][0] : oldData["default_mod_rate"];


    ReactDOM.render(
   		<RateDataBox
			id="modeRateDataBox"
			default_bnd_rate={default_bnd_rate}
			default_brk_rate={default_brk_rate}
			default_mod_rate={default_mod_rate}
			readonly={readonly}
			onDataUpdate={handleRateInfoUpdate(modelId, readonly)}
			instantiated={true}/>,
      document.getElementById('modelRateData')
    );
};


function sendRateDataUpdate(modelId, data) {
	if ("default_bnd_rate" in data) {
		data["default_bnd_rate"] = data["default_bnd_rate"][0];
	}
	if ("default_brk_rate" in data) {
		data["default_brk_rate"] = data["default_brk_rate"][0];
	}
	if ("default_mod_rate" in data) {
		data["default_mod_rate"] = data["default_mod_rate"][0];
	}

	$.ajax({
	    url:  modelId + "/update-rate-data",
	    type: 'post',
	    data: JSON.stringify(data),
	    dataType: 'json',
    	contentType: 'application/json',
	}).done(function () {
		// if (successCallback) successCallback();
	}).fail(function (xhr, status, error) {
		console.log("Failed send the request");
		console.log(error);
		// if (failCallback) failCallback();
	});
};

function handleRateInfoUpdate(modelId, readonly) {
	return function(data, oldData) {
		renderRateDataBox(modelId, data, oldData, readonly);
		sendRateDataUpdate(modelId, data);
	}
}