function renderMetaDataBox(modelId, data, oldData) {
	var name = ("name" in data) ? data["name"] : oldData["name"],
	 	desc = ("desc" in data) ? data["desc"] : oldData["desc"],
	 	organism = ("organism" in data) ? data["organism"] : oldData["organism"];
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
