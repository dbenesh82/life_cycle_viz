function draw(data) {
    "use strict";

    // set margins for plot
    var margin = {top: 10, right: 10, bottom: 60, left: 80},
        chartwidth = 750,
        chartheight = 500,
        canvaswidth = chartwidth + margin.right + margin.left,
        canvasheight = chartheight + margin.top + margin.bottom;

    // set the width of the text divs above and below plots to be same as plot
    d3.selectAll('div.text_divs')
        .style('width', canvaswidth)
        .style('margin-left', -canvaswidth / 2);
    // set the size of the main container for the interactive plot
    d3.select(".main_container")
        .style('width', canvaswidth)
        .style('margin-left', -canvaswidth / 2);

    // create container for buttons
    var button_container = d3.select(".main_container")
        .append("div")
        .attr('class', 'button_container')
        .style('width', (canvaswidth-margin.left/2) + "px");

    // create buttons for interactivity
    var buttons = button_container.selectAll("button")
        .data(["Random species", "One host cycles", "Two host cycles", "Three host cycles", "Four plus host cycles",
            "To intermediate host", "To definitive host", "To facultative host", "To humans", "RESET"])
        .enter()
        .append('button')
        .attr('class', 'buttons')
        .attr('id', function(d) {
            return d.split(' ').join('_');
        })
        .text(function(d) {
            return d;
        })
        .style('width', chartwidth / 5 + "px")
        .style('height', '40px');


    // create svg element as the chart
    var svg = d3.select(".main_container")
        .append("svg")
        .attr("width", canvaswidth)
        .attr("height", canvasheight);


    // create scales
    var xscale = d3.scalePoint()
        .domain(["propagule", "1st", "2nd", "3rd", "4th", "5th"])
        .range([margin.left, chartwidth]) // scale from margin to width
        .padding(0.2);
    var yscale = d3.scaleLog()
        .range([chartheight, margin.bottom]) // (inverse) scale from height (bottom) to upper marginn
        .domain(d3.extent(data, function(d) {
            return d['Biovolume'];
        }));
    var colscale = d3.scaleOrdinal(d3.schemeCategory10);

    // define axes
    var xaxis = d3.axisBottom(xscale);
    var yaxis = d3.axisLeft(yscale);

    // add axes to the svg element
    svg.append('g') // add x-axis
        .attr('class', 'x axis')
        .attr('transform', "translate(0," + chartheight + ")")
        .call(xaxis);
    svg.append("text") // add x title
        .attr('class', 'x title')
        .attr("transform", "translate(" + (margin.left + chartwidth / 2) + "," +
            (margin.top + chartheight + (margin.bottom / 1.5)) + ")") // center below axis
        .text('Host in cycle');
    svg.append('g') // add y-axis
        .attr('class', 'y axis')
        .attr('transform', "translate(" + margin.left + ",0)")
        .call(yaxis.ticks(5));
    svg.append("g") // add y-grid
        .attr("class", "grid")
        .attr('transform', "translate(" + margin.left + ",0)")
        .call(yaxis.ticks(5)
            .tickSize(-chartwidth + margin.left)
            .tickFormat("")
        );
    svg.append('text') // add y title
        .attr('class', 'y title')
        .attr("transform", "translate(" + (margin.left / 3) + "," +
            (margin.top + (chartheight / 2)) + ") rotate(-90)")
        .text('Parasite biovolume (mm cubed)');
    d3.selectAll('.tick').select('text') // assign class to ticklabels; can refer to it in CSS
        .attr('class', 'ticklabels');


    /*
    to interactively highlight each connection between points
    need to have each line independent (i.e. not a path). This loop
    restructures data as links between points, and is used to make the lines
    */
    var links = []
    for (var i = 0; i < (data.length - 1); i += 1) {
        var sp1 = data[i]["Parasite.species"], // create variables for making new data
            sp2 = data[i + 1]["Parasite.species"],
            size1 = data[i]["Biovolume"],
            size2 = data[i + 1]["Biovolume"],
            hostn1 = data[i]["Host.no"],
            hostn2 = data[i + 1]["Host.no"];
        if ((sp1 == sp2) && ((hostn2 - hostn1) == 1)) { // create new data object (row)
            var link_row = {
                Species: sp1,
                Host1: data[i]['Host.nofac'],
                Host2: data[i + 1]['Host.nofac'],
                Biov1: size1,
                Biov2: size2,
                maxLCL: data[i]['maxLCL'],
                to_int: data[i]['trans_to_int'],
                to_def: data[i]['trans_to_def'],
                to_fac: data[i]['trans_to_fac'],
                to_hum: data[i]['trans_to_human']
            };
            links.push(link_row); // add each 'link' to a data array
        };
    };


    // plot points
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "species points")
        .attr("id", function(d) {
            return d['Parasite.species'].split(' ').join('_');
        })
        .attr('cx', function(d) {
            return xscale(d['Host.nofac']);
        })
        .attr('cy', function(d) {
            return yscale(d['Biovolume']);
        })
        .attr('r', 3)
        .attr('fill', function(d) {
            return colscale(d['maxLCL']);
        })
        .attr('opacity', 0.05);

    // plot line segments connecting points for each species
    svg.selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr("class", "species lines")
        .attr("id", function(d) {
            return d.Species.split(' ').join('_');
        })
        .attr("x1", function(d) {
            return xscale(d.Host1);
        })
        .attr("x2", function(d) {
            return xscale(d.Host2);
        })
        .attr("y1", function(d) {
            return yscale(d.Biov1);
        })
        .attr("y2", function(d) {
            return yscale(d.Biov2);
        })
        .attr("stroke", function(d) {
            return colscale(d.maxLCL);
        })
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 0.1)
        .attr("fill", "none");

    // add explanatory text box below the svg
    d3.select('.main_container')
        .append('div')
        .attr('class', 'explanation')
        .text("Parasites start off as propagules (eggs or free larvae) before infecting one or more hosts in succession. Steep lines indicate substantial worm growth at a particular stage in the cycle. Colors correspond to species with different life cycle lengths, that is whether they have one, two, three hosts, etc. in their life cycle.")
        .style('width', (canvaswidth - margin.left) + "px")
        .style("opacity", 1);



    // create functions to interactively update plot elements (points, lines, text)
    var update_points = function(data_var, data_grp, color, opacity, r) {
        /*
        updates points based on a conditional where a variable ('data_var')
        equals a certain value ('data_grp'). 'color', 'opacity', and 'r' set
        attributes for the chosen group.
        */
        svg.selectAll("circle")
            .transition()
            .duration(1500)
            .attr('fill', function(d) {
                if (d[data_var] == data_grp) {
                    return color;
                } else {
                    return 'gray';
                }
            })
            .attr('opacity', function(d) {
                if (d[data_var] == data_grp) {
                    return opacity;
                } else {
                    return 0.05;
                }
            })
            .attr('r', function(d) {
                if (d[data_var] == data_grp) {
                    return r;
                } else {
                    return 3
                }
            });
    };

    var update_lines = function(data_var, data_grp, color, opacity) {
        /*
        updates line segments based on a variable ('data_var') having a
        certain value ('data_grp'). 'color' and 'opacity' set
        attributes for the chosen group.
        */
        svg.selectAll("line.species.lines")
            .transition()
            .duration(1500)
            .attr("stroke", function(d) {
                if (d[data_var] == data_grp) {
                    return color;
                } else {
                    return 'gray';
                }
            })
            .attr("stroke-opacity", function(d) {
                if (d[data_var] == data_grp) {
                    return opacity;
                } else {
                    return 0.05;
                }
            });
    };

    var update_annotation = function(text_for_annotation, color) {
        // remove old annotation, add/update new one
        svg.selectAll(".annotation") //remove old annotation, if any
            .transition()
            .duration(1500)
            .style("opacity", 0)
            .remove();
        svg.append('text') // (re)create a text element
            .style("opacity", 0)
            .attr('class', 'annotation')
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + xscale("3rd") + "," + yscale(1e-5) + ")")
            .text(text_for_annotation)
            .attr('fill', color)
            .transition() // transition text in
            .duration(1500)
            .style("opacity", 1);
    };

    var update_explanation = function(text_for_explanation) {
        // remove old explanatory text, add/update new one below chart
        d3.selectAll(".explanation")
            .transition()
            .duration(750)
            .style("opacity", 0) // fade out explanation
            .transition()
            .duration(750)
            .text(text_for_explanation) // fade in new text
            .style("opacity", 1);
    };




    // make each button functional
    d3.select("button#One_host_cycles")
        .on('click', function() {
            update_points('maxLCL', 1, colscale(1), 0.5, 5);
            update_lines('maxLCL', 1, colscale(1), 0.5);
            update_annotation("Species with one host cycles", colscale(1));
            update_explanation(
              "Parasite species that infect just one host have simple life cycles. Their lone host is usually a vertebrate in which they grow substantially.");
        });

    d3.select("button#Two_host_cycles")
        .on('click', function() {
            update_points('maxLCL', 2, colscale(2), 0.3, 5);
            update_lines('maxLCL', 2, colscale(2), 0.3);
            update_annotation("Species with two host cycles", colscale(2));
            update_explanation(
              "Parasite species that obligatorily infect multiple hosts have complex life cycles. The first host is the intermediate host, and the second host is the definitive host. Reproduction occurs in the definitive host. Parasites with two-host cycles usually grow in both hosts, but particularly the definitive host.");
        });

    d3.select("button#Three_host_cycles")
        .on('click', function() {
            update_points('maxLCL', 3, colscale(3), 0.5, 5);
            update_lines('maxLCL', 3, colscale(3), 0.5);
            update_annotation("Species with three host cycles", colscale(3));
            update_explanation(
              "Parasite species with three-host life cycles infect two intermediate hosts before reproducing in the third (definitive) host. Growth can occur at any stage, but it is common that little growth occurs in the second intermediate host.");
        });


    d3.select("button#Four_plus_host_cycles")
        .on('click', function() {
            // had to re-write update function for this button as conditional statements were more complex
            svg.selectAll("circle")
                .transition()
                .duration(1500)
                .attr('fill', function(d) {
                    if (d['maxLCL'] == 4 || d['maxLCL'] == 5) {
                        return colscale(4);
                    } else {
                        return 'gray';
                    }
                })
                .attr('opacity', function(d) {
                    if (d['maxLCL'] == 4 || d['maxLCL'] == 5) {
                        return 1;
                    } else {
                        return 0.05;
                    }
                })
                .attr('r', function(d) {
                    if (d['maxLCL'] == 4 || d['maxLCL'] == 5) {
                        return 5;
                    } else {
                        return 3;
                    }
                });

            svg.selectAll("line.species.lines")
                .transition()
                .duration(1500)
                .attr("stroke", function(d) {
                    if (d['maxLCL'] == 4 || d['maxLCL'] == 5) {
                        return colscale(4);
                    } else {
                        return 'gray';
                    }
                })
                .attr("stroke-opacity", function(d) {
                    if (d['maxLCL'] == 4 || d['maxLCL'] == 5) {
                        return 1;
                    } else {
                        return 0.05;
                    }
                });

            update_annotation("Species with four or more hosts", colscale(4));
            update_explanation(
              "Few parasites have cycles longer than three hosts. Growth may or may not occur in the intermediate hosts, and often the intermediate hosts are facultative, which means the parasite can complete the cycle with or without infecting them.");
        });




    // make set of species for use with random species button
    var species = d3.set();
    data.forEach(function(d) {
        species.add(d['Parasite.species']);
    });

    d3.select("button#Random_species")
        .on('click', function() {
            //get a random species and its associated data
            var randsp = species.values()[
                Math.random() * species.values().length | 0
            ];
            // subset data for the rand species
            var rsdata = data.filter(function(d) {
                return d['Parasite.species'] == randsp
            });
            // create annotation text for random species
            var rsannotation = randsp + ", " + rsdata[0]['maxLCL'] + " host cycle, " + rsdata[0]['complete_size'];

            //update plot
            update_points('Parasite.species', randsp, 'red', 1, 5);
            update_lines('Species', randsp, 'red', 1);
            update_annotation(rsannotation, 'red');
            update_explanation(
                "The database contains 973 parasite species, and there is a wide diversity of growth patterns. Body sizes were not always available for every life cycle stage.");
        });



    d3.select("button#To_intermediate_host")
        .on('click', function() {
            update_points('Def.int', 'int', colscale(5), 0.4, 5);
            update_lines('to_int', 'yes', colscale(5), 0.4);
            update_annotation("Growth in intermediate hosts", colscale(5));
            update_explanation(
                "Parasites use intermediate hosts for growth, development, and transportation between hosts, but not for reproduction. Growth in a first intermediate host is common, whereas growth in latter intermediate hosts may or may not occur.");
        });
    d3.select("button#To_definitive_host")
        .on('click', function() {
            update_points('Def.int', 'def', colscale(6), 0.3, 5);
            update_lines('to_def', 'yes', colscale(6), 0.3);
            update_annotation("Growth in definitive hosts", colscale(6));
            update_explanation(
                "Parasites reproduce in their definitive host. In many animals, bigger females make more eggs. Thus, it is not surprising that parasites usually grow a lot in their final host.");
        });
    d3.select("button#To_facultative_host")
        .on('click', function() {
            update_points('Facultative_bool', 'yes', colscale(7), 1, 5);
            update_lines('to_fac', 'yes', colscale(7), 1);
            update_annotation("Growth in facultative hosts", colscale(7));
            update_explanation(
                "Most parasites have a fixed succession of hosts they must infect to complete the life cycle. But some do not. They have flexible life cycles in which a given host may or may not be infected during the cycle. Commonly, these facultative hosts are in the middle of a cycle (2nd host) and growth is minimal.");
        });
    d3.select("button#To_humans")
        .on('click', function() {
            update_points('human', 'yes', colscale(8), 1, 5);
            update_lines('to_hum', 'yes', colscale(8), 1);
            update_annotation("Growth in humans", colscale(8));
            update_explanation(
                "We also have our share of worms! Several worms that infect humans exhibit substantial growth; we are usually definitive hosts.");
        });


    d3.select("button#RESET")
        .on('click', function() {
            // return points to original color and shape
            svg.selectAll("circle")
                .transition()
                .duration(1500)
                .attr('r', 3)
                .attr('fill', function(d) {
                    return colscale(d['maxLCL']);
                })
                .attr('opacity', 0.05);

            // return line segments to original color and shape
            svg.selectAll('line')
                .transition()
                .duration(1500)
                .attr("stroke", function(d) {
                    return colscale(d.maxLCL);
                })
                .attr("stroke-width", 1)
                .attr("stroke-opacity", 0.1)
                .attr("fill", "none");

            update_annotation("", 'black');
            update_explanation(
                "Parasites start off as propagules (eggs or free larvae) before infecting one or more hosts in succession. Steep lines indicate substantial worm growth at a particular stage in the cycle. Colors correspond to species with different life cycle lengths, that is whether they have one, two, three hosts, etc. in their life cycle.");
        });


} //end of draw function
