// Evvent handler for node error event

// Export the node error event handler
module.exports = async (node, error) => {

    console.log(`Node "${node.name}" encountered an error: ${error.message}.`);

}