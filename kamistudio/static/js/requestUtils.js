
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
