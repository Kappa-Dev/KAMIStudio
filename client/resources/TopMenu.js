/* This module adds the top menu where display options can be selected
 * @ Author Sebastien Legare
 * This module is part of the KAMI project
 * this project is under AGPL Licence
*/
define([
	"resources/d3/d3.js",
	"resources/converter.js",
	"resources/requestFactory.js",
	"resources/kamiRequestFactory.js"
],
	function (d3, converter, rqFactory, kamiRqFactory) {
		/* Create a new inputFile module
		 * @input : container_id : the container to bind this hierarchy
		 * @input : dispatch : the dispatch event object
		 * @input : server_url : the regraph server url
		 * @return : a new TopMenu object
		 */
		return function TopMenu(container_id, dispatch, server_url) {
			if (!server_url) throw new Error("server url undefined");
			var srv_url = server_url;//the current url of the server
			var request = new rqFactory(server_url);
			var kamiRequest = new kamiRqFactory(server_url);
			var disp = dispatch;//global dispatcher for events

			var selector;//object type selector
			/* initialize all the HTML objects
			 * this function is self called at instantiation
			 */
			(function init() {
				var top_menu = d3.select("#" + container_id)
				    .append("div")
				    .attr("id", "top_menu");
                                // Checkboxes to select type "do" or "be".
                                top_menu.append("input")
                                    .attr("type", "checkbox")
                                    .attr("id", "do_chkbx")
                                top_menu.append("label")
                                    .attr("for", "do_chkbx")
                                    .attr("id", "do_chkbx_lbl");
                                document.getElementById("do_chkbx_lbl")
                                    .innerHTML = "Do:";
                                top_menu.append("input")
                                    .attr("type", "checkbox")
                                    .attr("id", "is_chkbx");
                                top_menu.append("label")
                                    .attr("for", "is_chkbx")
                                    .attr("id", "is_chkbx_lbl");
                                document.getElementById("is_chkbx_lbl")
                                    .innerHTML = "Be:";
                                // Checkboxes to select test "true" or "false".
                                top_menu.append("input")
                                    .attr("type", "checkbox")
                                    .attr("id", "true_chkbx");
                                top_menu.append("label")
                                    .attr("for", "true_chkbx")
                                    .attr("id", "true_chkbx_lbl");
                                document.getElementById("true_chkbx_lbl")
                                    .innerHTML = "True:";
                                top_menu.append("input")
                                    .attr("type", "checkbox")
                                    .attr("id", "false_chkbx");
                                top_menu.append("label")
                                    .attr("for", "false_chkbx")
                                    .attr("id", "false_chkbx_lbl");
                                document.getElementById("false_chkbx_lbl")
                                    .innerHTML = "False:";
                                // Checkbox to show and hide details.
                                top_menu.append("input")
                                    .attr("type", "checkbox")
                                    .attr("id", "detail_chkbx")
                                top_menu.append("label")
                                    .attr("for", "detail_chkbx")
                                    .attr("id", "detail_chkbx_lbl");
                                document.getElementById("detail_chkbx_lbl")
                                    .innerHTML = "Show Details:";

                                // Ensure that only one checkbox per group 
                                // can be checked at a time. I do that instead
                                // of using radio buttons because I need users
                                // to be able to uncheck any selection.
                                d3.select("#do_chkbx")
                                    .on("click", function () {
                                        d3.select("#is_chkbx")
                                            .property("checked", false);
                                    });
                                d3.select("#is_chkbx")
                                    .on("click", function () {
                                        d3.select("#do_chkbx")
                                            .property("checked", false);
                                    });
                                d3.select("#true_chkbx")
                                    .on("click", function () {
                                        d3.select("#false_chkbx")
                                            .property("checked", false);
                                    });
                                d3.select("#false_chkbx")
                                    .on("click", function () {
                                        d3.select("#true_chkbx")
                                            .property("checked", false);
                                    });

                                //// Add keyboard shortcuts to select node 
                                //// type and test.
                                //// 'd' to toggle Do type (keyCode 68)
                                //// 'i' to toggle Is type (keyCode 73)
                                //// 't' to toggle True test (keyCode 84)
                                //// 'f' to toggle False test (keyCode 70)
                                //// 's' to toggle Details (keyCode 83)
                                //// Transfered to InteractiveGraph.js because,
                                //// somehow, it stops working after clicking
                                //// on the left panel when the code is left 
                                //// here.
                                //d3.select("body")
                                //   .on("keydown", function() {
                                //       if (d3.event.keyCode === 68) {
                                //           chk_state = d3.select("#do_chkbx")
                                //               .property("checked");
                                //           if (chk_state == false) {
                                //               d3.select("#do_chkbx")
                                //                   .property("checked", true);
                                //               d3.select("#is_chkbx")
                                //                   .property("checked", false);
                                //           } if (chk_state == true) {
                                //               d3.select("#do_chkbx")
                                //                   .property("checked", false);
                                //           }
                                //       }
                                //       else if (d3.event.keyCode === 73) {
                                //           chk_state = d3.select("#is_chkbx")
                                //               .property("checked");
                                //           if (chk_state == false) {
                                //               d3.select("#is_chkbx")
                                //                   .property("checked", true);
                                //               d3.select("#do_chkbx")
                                //                   .property("checked", false);
                                //           } if (chk_state == true) {
                                //               d3.select("#is_chkbx")
                                //                   .property("checked", false);
                                //           }
                                //       } 
                                //       else if (d3.event.keyCode === 84) {
                                //           chk_state = d3.select("#true_chkbx")
                                //               .property("checked");
                                //           if (chk_state == false) {
                                //               d3.select("#true_chkbx")
                                //                   .property("checked", true);
                                //               d3.select("#false_chkbx")
                                //                   .property("checked", false);
                                //           } if (chk_state == true) {
                                //               d3.select("#true_chkbx")
                                //                   .property("checked", false);
                                //           }
                                //       }
                                //       else if (d3.event.keyCode === 70) {
                                //           chk_state = d3.select("#false_chkbx")
                                //               .property("checked");
                                //           if (chk_state == false) {
                                //               d3.select("#false_chkbx")
                                //                   .property("checked", true);
                                //               d3.select("#true_chkbx")
                                //                   .property("checked", false);
                                //           } if (chk_state == true) {
                                //               d3.select("#false_chkbx")
                                //                   .property("checked", false);
                                //           }
                                //       }
                                //       else if (d3.event.keyCode === 83) {
                                //           chk_state = d3.select("#detail_chkbx")
                                //               .property("checked");
                                //           if (chk_state == false) {
                                //               d3.select("#detail_chkbx")
                                //                   .property("checked", true);
                                //           } if (chk_state == true) {
                                //               d3.select("#detail_chkbx")
                                //                   .property("checked", false);
                                //           }
                                //       }
                                //   });

                                // Add mouseover tooltips.
                                d3.select("#top_menu").append("div")
                                    .attr("id", "do_tooltip")
                                    .style("visibility", "hidden")
                                    .text("shortcut: d");
                                d3.select("#do_chkbx")
                                    .on("mouseover", function() {
                                        d3.select("#do_tooltip").transition()
                                            .delay(1000)
                                            .style("visibility", "visible");
                                    })
                                    .on("mouseout" , function() {
                                        d3.select("#do_tooltip")
                                            .interrupt().transition()
                                            .style("visibility", "hidden");
                                    });
                                d3.select("#top_menu").append("div")
                                    .attr("id", "is_tooltip")
                                    .style("visibility", "hidden")
                                    .text("shortcut: i");
                                d3.select("#is_chkbx")
                                    .on("mouseover", function() {
                                        d3.select("#is_tooltip").transition()
                                            .delay(1000)
                                            .style("visibility", "visible");
                                    })
                                    .on("mouseout" , function() {
                                        d3.select("#is_tooltip")
                                            .interrupt().transition()
                                            .style("visibility", "hidden");
                                    });
                                d3.select("#top_menu").append("div")
                                    .attr("id", "true_tooltip")
                                    .style("visibility", "hidden")
                                    .text("shortcut: t");
                                d3.select("#true_chkbx")
                                    .on("mouseover", function() {
                                        d3.select("#true_tooltip").transition()
                                            .delay(1000)
                                            .style("visibility", "visible");
                                    })
                                    .on("mouseout" , function() {
                                        d3.select("#true_tooltip")
                                            .interrupt().transition()
                                            .style("visibility", "hidden");
                                    });
                                d3.select("#top_menu").append("div")
                                    .attr("id", "false_tooltip")
                                    .style("visibility", "hidden")
                                    .text("shortcut: f");
                                d3.select("#false_chkbx")
                                    .on("mouseover", function() {
                                        d3.select("#false_tooltip").transition()
                                            .delay(1000)
                                            .style("visibility", "visible");
                                    })
                                    .on("mouseout" , function() {
                                        d3.select("#false_tooltip")
                                            .interrupt().transition()
                                            .style("visibility", "hidden");
                                    });
                                d3.select("#top_menu").append("div")
                                    .attr("id", "detail_tooltip")
                                    .style("visibility", "hidden")
                                    .text("shortcut: s (action graph only)");
                                d3.select("#detail_chkbx")
                                    .on("mouseover", function() {
                                        d3.select("#detail_tooltip").transition()
                                            .delay(1000)
                                            .style("visibility", "visible");
                                    })
                                    .on("mouseout" , function() {
                                        d3.select("#detail_tooltip")
                                            .interrupt().transition()
                                            .style("visibility", "hidden");
                                    })
                                    .on("click", clickDetails);


			}());
		}
                function clickDetails() {
                    if (d3.select("#detail_chkbx").property("checked") == true) {
                        d3.selectAll(".contact").style("visibility", "hidden")
                        d3.selectAll(".region").style("visibility", "visible")
                        d3.selectAll(".site").style("visibility", "visible")
                        d3.selectAll(".residue").style("visibility", "visible")
                        d3.selectAll(".state").style("visibility", "visible")
                        d3.selectAll(".mod").style("visibility", "visible")
                        d3.selectAll(".bnd").style("visibility", "visible")
                        d3.selectAll(".link").style("visibility", "visible")
                    } else {
                        d3.selectAll(".contact").style("visibility", "visible")
                        d3.selectAll(".region").style("visibility", "hidden")
                        d3.selectAll(".site").style("visibility", "hidden")
                        d3.selectAll(".residue").style("visibility", "hidden")
                        d3.selectAll(".state").style("visibility", "hidden")
                        d3.selectAll(".mod").style("visibility", "hidden")
                        d3.selectAll(".bnd").style("visibility", "hidden")
                        d3.selectAll(".link").style("visibility", "hidden")
                    }
                }
	});
