function sendUpdateNuggetDesc(modelId, nuggetId, desc) {
    /** Send a request to update nugget description*/
    $.ajax({
          url:  modelId + "/nugget/" + nuggetId + "/update-nugget-desc",
          type: 'post',
          data: JSON.stringify({
            "nugget_id": nuggetId,
            "desc": desc
          }),
          dataType: 'json',
          contentType: 'application/json',
    }).done(function () {
        // if (successCallback) successCallback();
    }).fail(function (xhr, status, error) {
        console.log("Failed to update nugget description");
        console.log(error);
        // if (failCallback) failCallback();
    });
}


function sendUpdateNuggetNodeAttrs(modelId, nuggetId, nodeId, attrs, successCallback) {
    /** Send a request to update nugget node attrs*/
    $.ajax({
          url:  modelId + "/nugget/" + nuggetId +"/update-node-attrs",
          type: 'post',
          data: JSON.stringify({
            "id": nodeId,
            "attrs": attrs
          }),
          dataType: 'json',
          contentType: 'application/json',
    }).done(function () {
    // if (successCallback) successCallback();
    }).fail(function (xhr, status, error) {
        console.log("Failed to update nugget node attributes");
        console.log(error);
    });
}


function sendUpdateNuggetEdgeAttrs(modelId, nuggetId, sourceId, targetId, attrs) {
    /** Send a request to update nugget edge attrs*/
    $.ajax({
          url:  modelId + "/nugget/" + nuggetId + "/update-edge-attrs",
          type: 'post',
          data: JSON.stringify({
            "source": sourceId,
            "target": targetId,
            "attrs": attrs
          }),
          dataType: 'json',
          contentType: 'application/json',
    }).done(function () {
        // if (successCallback) successCallback();
    }).fail(function (xhr, status, error) {
        console.log("Failed to update new node positions");
        console.log(error);
        // if (failCallback) failCallback();
    });
}


function postDataWithRedirect(data, url) {
  $.ajax({
        url:  url,
        type: 'post',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
  }).done(function (data) {
      window.location.href = data["redirect"];
  }).fail(function (xhr, status, error) {
      console.log("Failed to post data to '" + url + "'");
      console.log(error);
      // if (failCallback) failCallback();
  });
}


function getData(url, successCallback=null, failCallback=null) {
  $.ajax({
      url:  url,
      type: 'get',
      dataType: 'json',
  }).done(function (data) {
      if (successCallback) {
        successCallback(data);
      }
  }).fail(function (xhr, status, error) {
      if (failCallback) {
        failCallback(status, error);
      }
  });
}


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
