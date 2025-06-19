/**
 * Visualization module for 2D and 3D plotting
 * Implements REQ-008, REQ-009, REQ-010
 */

class VisualizationEngine {
    constructor() {
        this.plots = new Map();
        this.plotlyLoaded = false;
        this.chartjsLoaded = false;

        // Load plotting libraries dynamically
        this.loadPlotlyLibrary();
        this.loadChartJsLibrary();

        // Real-time update intervals
        this.updateIntervals = new Map();
    }

    /**
     * Load Plotly library dynamically
     */
    async loadPlotlyLibrary() {
        if (this.plotlyLoaded) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.plot.ly/plotly-latest.min.js';
            script.onload = () => {
                this.plotlyLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Load Chart.js library dynamically
     */
    async loadChartJsLibrary() {
        if (this.chartjsLoaded) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                this.chartjsLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Create 2D plot (REQ-008)
     */
    async create2DPlot(containerId, data, options = {}) {
        await this.loadPlotlyLibrary();

        const defaultLayout = {
            title: options.title || '2D Plot',
            xaxis: {
                title: options.xLabel || 'X Axis',
                gridcolor: '#E0E0E0',
                showgrid: options.grid !== false
            },
            yaxis: {
                title: options.yLabel || 'Y Axis',
                gridcolor: '#E0E0E0',
                showgrid: options.grid !== false
            },
            plot_bgcolor: '#FAFAFA',
            paper_bgcolor: '#FFFFFF',
            font: {
                family: 'Arial, sans-serif',
                size: 12
            },
            showlegend: options.showLegend || false,
            hovermode: 'closest'
        };

        const layout = { ...defaultLayout, ...options.layout };

        // Prepare plot data
        const plotData = Array.isArray(data) ? data : [data];

        // Create the plot
        Plotly.newPlot(containerId, plotData, layout, {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: options.title || 'plot',
                height: 600,
                width: 800,
                scale: 2
            }
        });

        // Store plot reference
        const plotInfo = {
            id: containerId,
            type: '2d',
            data: plotData,
            layout: layout,
            options: options
        };

        this.plots.set(containerId, plotInfo);

        // Enable real-time updates if requested
        if (options.realTimeUpdate) {
            this.enableRealTimeUpdate(containerId, options.updateInterval || 1000);
        }

        return plotInfo;
    }

    /**
     * Create 3D plot (REQ-009)
     */
    async create3DPlot(containerId, data, options = {}) {
        await this.loadPlotlyLibrary();

        const defaultLayout = {
            title: options.title || '3D Plot',
            scene: {
                xaxis: {
                    title: options.xLabel || 'X Axis',
                    gridcolor: '#E0E0E0',
                    showgrid: options.grid !== false
                },
                yaxis: {
                    title: options.yLabel || 'Y Axis',
                    gridcolor: '#E0E0E0',
                    showgrid: options.grid !== false
                },
                zaxis: {
                    title: options.zLabel || 'Z Axis',
                    gridcolor: '#E0E0E0',
                    showgrid: options.grid !== false
                },
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.5 }
                }
            },
            paper_bgcolor: '#FFFFFF',
            plot_bgcolor: '#FAFAFA',
            font: {
                family: 'Arial, sans-serif',
                size: 12
            },
            showlegend: options.showLegend || false
        };

        const layout = { ...defaultLayout, ...options.layout };

        // Ensure data has proper 3D format
        const plotData = Array.isArray(data) ? data : [data];
        plotData.forEach(trace => {
            if (!trace.type) {
                trace.type = 'scatter3d';
            }
        });

        // Create the plot
        Plotly.newPlot(containerId, plotData, layout, {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png',
                filename: options.title || 'plot3d',
                height: 600,
                width: 800,
                scale: 2
            }
        });

        // Store plot reference
        const plotInfo = {
            id: containerId,
            type: '3d',
            data: plotData,
            layout: layout,
            options: options
        };

        this.plots.set(containerId, plotInfo);

        // Enable real-time updates if requested
        if (options.realTimeUpdate) {
            this.enableRealTimeUpdate(containerId, options.updateInterval || 1000);
        }

        return plotInfo;
    }

    /**
     * Create surface plot (3D) (REQ-009)
     */
    async createSurfacePlot(containerId, z, options = {}) {
        const data = [{
            type: 'surface',
            z: z,
            colorscale: options.colorscale || 'Viridis',
            showscale: options.showColorBar !== false,
            contours: {
                z: {
                    show: options.showContours || false,
                    usecolormap: true,
                    highlightcolor: "#42f462",
                    project: { z: true }
                }
            }
        }];

        return await this.create3DPlot(containerId, data, options);
    }

    /**
     * Create contour plot (2D representation of 3D data) (REQ-009)
     */
    async createContourPlot(containerId, z, options = {}) {
        await this.loadPlotlyLibrary();

        const data = [{
            type: 'contour',
            z: z,
            colorscale: options.colorscale || 'Viridis',
            showscale: options.showColorBar !== false,
            contours: {
                coloring: options.contourColoring || 'heatmap',
                showlabels: options.showLabels || false,
                labelfont: {
                    size: 12,
                    color: 'white',
                }
            },
            x: options.x || null,
            y: options.y || null
        }];

        const layout = {
            title: options.title || 'Contour Plot',
            xaxis: {
                title: options.xLabel || 'X Axis'
            },
            yaxis: {
                title: options.yLabel || 'Y Axis'
            }
        };

        return await this.create2DPlot(containerId, data, { ...options, layout });
    }

    /**
     * Create parametric plot (2D or 3D)
     */
    async createParametricPlot(containerId, tMin, tMax, xFunc, yFunc, zFunc = null, options = {}) {
        const steps = options.steps || 1000;
        const tValues = [];
        const xValues = [];
        const yValues = [];
        const zValues = zFunc ? [] : null;

        // Generate parametric values
        for (let i = 0; i <= steps; i++) {
            const t = tMin + (tMax - tMin) * i / steps;
            tValues.push(t);

            try {
                xValues.push(xFunc(t));
                yValues.push(yFunc(t));
                if (zFunc) {
                    zValues.push(zFunc(t));
                }
            } catch (e) {
                console.error('Error evaluating parametric function:', e);
            }
        }

        if (zFunc && zValues) {
            // 3D parametric plot
            const data = [{
                type: 'scatter3d',
                mode: 'lines',
                x: xValues,
                y: yValues,
                z: zValues,
                line: {
                    width: options.lineWidth || 4,
                    color: options.color || 'blue'
                },
                name: options.name || 'Parametric Curve'
            }];

            return await this.create3DPlot(containerId, data, options);
        } else {
            // 2D parametric plot
            const data = [{
                type: 'scatter',
                mode: 'lines',
                x: xValues,
                y: yValues,
                line: {
                    width: options.lineWidth || 2,
                    color: options.color || 'blue'
                },
                name: options.name || 'Parametric Curve'
            }];

            return await this.create2DPlot(containerId, data, options);
        }
    }

    /**
     * Update plot data (REQ-010)
     */
    updatePlotData(containerId, newData, traceIndex = 0) {
        const plotInfo = this.plots.get(containerId);
        if (!plotInfo) {
            console.error('Plot not found:', containerId);
            return;
        }

        if (Array.isArray(newData)) {
            // Update multiple traces
            Plotly.restyle(containerId, newData);
        } else {
            // Update single trace
            const update = {};
            Object.keys(newData).forEach(key => {
                update[key] = [newData[key]];
            });

            Plotly.restyle(containerId, update, [traceIndex]);
        }

        // Update stored data
        if (plotInfo.data[traceIndex]) {
            Object.assign(plotInfo.data[traceIndex], newData);
        }
    }

    /**
     * Enable real-time updates (REQ-010)
     */
    enableRealTimeUpdate(containerId, interval = 1000) {
        if (this.updateIntervals.has(containerId)) {
            this.disableRealTimeUpdate(containerId);
        }

        const plotInfo = this.plots.get(containerId);
        if (!plotInfo || !plotInfo.options.updateFunction) {
            console.error('No update function defined for plot:', containerId);
            return;
        }

        const intervalId = setInterval(async () => {
            try {
                const newData = await plotInfo.options.updateFunction();
                this.updatePlotData(containerId, newData);
            } catch (error) {
                console.error('Error updating plot:', error);
            }
        }, interval);

        this.updateIntervals.set(containerId, intervalId);
    }

    /**
     * Disable real-time updates
     */
    disableRealTimeUpdate(containerId) {
        const intervalId = this.updateIntervals.get(containerId);
        if (intervalId) {
            clearInterval(intervalId);
            this.updateIntervals.delete(containerId);
        }
    }

    /**
     * Create animated plot
     */
    async createAnimatedPlot(containerId, frames, options = {}) {
        await this.loadPlotlyLibrary();

        const layout = {
            title: options.title || 'Animated Plot',
            xaxis: {
                title: options.xLabel || 'X Axis',
                range: options.xRange || null
            },
            yaxis: {
                title: options.yLabel || 'Y Axis',
                range: options.yRange || null
            },
            updatemenus: [{
                x: 0,
                y: 0,
                yanchor: 'top',
                xanchor: 'left',
                showactive: false,
                direction: 'left',
                type: 'buttons',
                pad: { t: 87, r: 10 },
                buttons: [{
                    method: 'animate',
                    args: [null, {
                        mode: 'immediate',
                        fromcurrent: true,
                        transition: { duration: options.transitionDuration || 300 },
                        frame: { duration: options.frameDuration || 500, redraw: false }
                    }],
                    label: 'Play'
                }, {
                    method: 'animate',
                    args: [[null], {
                        mode: 'immediate',
                        transition: { duration: 0 },
                        frame: { duration: 0, redraw: false }
                    }],
                    label: 'Pause'
                }]
            }],
            sliders: [{
                pad: { l: 130, t: 55 },
                currentvalue: {
                    visible: true,
                    prefix: options.sliderPrefix || 'Frame:',
                    xanchor: 'right',
                    font: { size: 20, color: '#666' }
                },
                steps: frames.map((frame, i) => ({
                    method: 'animate',
                    label: frame.name || i.toString(),
                    args: [[frame.name || i.toString()], {
                        mode: 'immediate',
                        transition: { duration: 0 },
                        frame: { duration: 0, redraw: false }
                    }]
                }))
            }]
        };

        // Initial data
        const initialData = frames[0].data;

        // Create plot with initial data
        Plotly.newPlot(containerId, initialData, layout, {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        });

        // Add frames
        Plotly.addFrames(containerId, frames);

        return {
            id: containerId,
            type: 'animated',
            frames: frames,
            layout: layout,
            options: options
        };
    }

    /**
     * Export plot as image
     */
    async exportPlot(containerId, format = 'png', options = {}) {
        const plotInfo = this.plots.get(containerId);
        if (!plotInfo) {
            throw new Error('Plot not found');
        }

        const exportOptions = {
            format: format, // 'png', 'jpeg', 'webp', 'svg'
            width: options.width || 800,
            height: options.height || 600,
            scale: options.scale || 2,
            filename: options.filename || plotInfo.layout.title || 'plot'
        };

        return await Plotly.downloadImage(containerId, exportOptions);
    }

    /**
     * Create vector field plot (2D)
     */
    async createVectorField(containerId, x, y, u, v, options = {}) {
        await this.loadPlotlyLibrary();

        // Normalize vectors if requested
        if (options.normalize) {
            const magnitudes = [];
            for (let i = 0; i < u.length; i++) {
                for (let j = 0; j < u[i].length; j++) {
                    const mag = Math.sqrt(u[i][j] ** 2 + v[i][j] ** 2);
                    magnitudes.push(mag);
                    if (mag > 0) {
                        u[i][j] /= mag;
                        v[i][j] /= mag;
                    }
                }
            }
        }

        // Create quiver plot
        const data = [{
            type: 'scatter',
            mode: 'markers',
            x: x.flat(),
            y: y.flat(),
            marker: {
                size: 0.1,
                color: 'black'
            },
            showlegend: false
        }];

        // Add arrows
        const scale = options.scale || 0.1;
        for (let i = 0; i < x.length; i++) {
            for (let j = 0; j < x[i].length; j++) {
                data.push({
                    type: 'scatter',
                    mode: 'lines',
                    x: [x[i][j], x[i][j] + scale * u[i][j]],
                    y: [y[i][j], y[i][j] + scale * v[i][j]],
                    line: {
                        color: options.color || 'blue',
                        width: options.lineWidth || 1
                    },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            }
        }

        const layout = {
            title: options.title || 'Vector Field',
            xaxis: {
                title: options.xLabel || 'X',
                scaleanchor: 'y',
                scaleratio: 1
            },
            yaxis: {
                title: options.yLabel || 'Y'
            },
            showlegend: false
        };

        return await this.create2DPlot(containerId, data, { ...options, layout });
    }

    /**
     * Create polar plot
     */
    async createPolarPlot(containerId, r, theta, options = {}) {
        await this.loadPlotlyLibrary();

        const data = [{
            type: 'scatterpolar',
            r: r,
            theta: theta,
            mode: options.mode || 'lines+markers',
            line: {
                color: options.color || 'blue',
                width: options.lineWidth || 2
            },
            marker: {
                size: options.markerSize || 6
            },
            name: options.name || 'Polar Plot'
        }];

        const layout = {
            title: options.title || 'Polar Plot',
            polar: {
                radialaxis: {
                    visible: true,
                    range: options.rRange || [0, Math.max(...r)]
                },
                angularaxis: {
                    tickmode: options.angleTickMode || 'linear',
                    dtick: options.angleTick || 45
                }
            },
            showlegend: options.showLegend || false
        };

        Plotly.newPlot(containerId, data, layout, {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        });

        return {
            id: containerId,
            type: 'polar',
            data: data,
            layout: layout,
            options: options
        };
    }

    /**
     * Create heat map
     */
    async createHeatMap(containerId, z, options = {}) {
        await this.loadPlotlyLibrary();

        const data = [{
            type: 'heatmap',
            z: z,
            x: options.x || null,
            y: options.y || null,
            colorscale: options.colorscale || 'Viridis',
            showscale: options.showColorBar !== false,
            hoverongaps: false,
            xgap: options.xgap || 0,
            ygap: options.ygap || 0
        }];

        const layout = {
            title: options.title || 'Heat Map',
            xaxis: {
                title: options.xLabel || 'X',
                side: 'bottom'
            },
            yaxis: {
                title: options.yLabel || 'Y'
            },
            annotations: options.showValues ? this.createHeatMapAnnotations(z) : []
        };

        return await this.create2DPlot(containerId, data, { ...options, layout });
    }

    /**
     * Create annotations for heat map values
     */
    createHeatMapAnnotations(z) {
        const annotations = [];
        for (let i = 0; i < z.length; i++) {
            for (let j = 0; j < z[i].length; j++) {
                annotations.push({
                    x: j,
                    y: i,
                    text: z[i][j].toFixed(2),
                    showarrow: false,
                    font: {
                        color: 'white',
                        size: 12
                    }
                });
            }
        }
        return annotations;
    }

    /**
     * Create histogram
     */
    async createHistogram(containerId, data, options = {}) {
        await this.loadPlotlyLibrary();

        const histData = [{
            type: 'histogram',
            x: data,
            nbinsx: options.bins || null,
            histnorm: options.normalize || '',
            marker: {
                color: options.color || 'blue',
                line: {
                    color: 'black',
                    width: 1
                }
            },
            name: options.name || 'Histogram'
        }];

        const layout = {
            title: options.title || 'Histogram',
            xaxis: {
                title: options.xLabel || 'Value'
            },
            yaxis: {
                title: options.yLabel || (options.normalize ? 'Probability' : 'Frequency')
            },
            bargap: options.bargap || 0.05
        };

        return await this.create2DPlot(containerId, histData, { ...options, layout });
    }

    /**
     * Create box plot
     */
    async createBoxPlot(containerId, data, options = {}) {
        await this.loadPlotlyLibrary();

        const boxData = data.map((series, index) => ({
            type: 'box',
            y: series.values || series,
            name: series.name || `Series ${index + 1}`,
            boxpoints: options.showPoints || 'outliers',
            marker: {
                color: series.color || options.colors?.[index] || 'blue',
                outliercolor: 'rgba(219, 64, 82, 0.6)',
                line: {
                    outliercolor: 'rgba(219, 64, 82, 1.0)',
                    outlierwidth: 2
                }
            }
        }));

        const layout = {
            title: options.title || 'Box Plot',
            yaxis: {
                title: options.yLabel || 'Value'
            },
            showlegend: options.showLegend !== false
        };

        return await this.create2DPlot(containerId, boxData, { ...options, layout });
    }

    /**
     * Clear all plots and stop updates
     */
    clearAll() {
        // Stop all real-time updates
        this.updateIntervals.forEach((intervalId, containerId) => {
            clearInterval(intervalId);
        });
        this.updateIntervals.clear();

        // Clear plot references
        this.plots.clear();
    }

    /**
     * Get plot by container ID
     */
    getPlot(containerId) {
        return this.plots.get(containerId);
    }

    /**
     * Resize plot
     */
    resizePlot(containerId) {
        Plotly.Plots.resize(containerId);
    }
}

// Global visualization engine instance
const visualizationEngine = new VisualizationEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizationEngine;
}