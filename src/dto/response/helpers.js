// Id como string, tanto si la referencia es un ObjectId como si es un documento con populate
export const refId = (ref) => (ref?._id ?? ref)?.toString()

// Una referencia sin populate es un ObjectId; con populate es el documento relacionado
export const isPopulated = (ref) => Boolean(ref) && typeof ref === 'object' && ref._bsontype !== 'ObjectId'
