const deleteIndexIfExists = async (client, indexName) => {
  try {
    await client.indices.delete({index: indexName});
    return true
  } catch (e) {
    console.log(`Didn't delete index ${indexName}`);
    return false
  }
}

const deleteIndicesIfExists = async (client, indices) => {
  try {
    const promises = indices.map(index => deleteIndexIfExists(client, index));
    await Promise.all(promises)
  } catch (e) {
    console.log(e)
  }
}

module.exports = deleteIndicesIfExists
