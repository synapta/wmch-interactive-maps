// CONSTANTS
export const DATA_LOADED = 'DATA_LOADED';
export const ADD_METADATA = 'ADD_METADATA';

export function dataLoaded() {
  return {
    type: DATA_LOADED
  };
}

export function addMetadata(metadata) {
  return {
    type: ADD_METADATA,
    metadata
  };
}
