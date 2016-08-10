/* */ 
var assert = require('assert');
var fs = require('fs');
var mime = require('mime');
var util = require('util');
var MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
var MAX_FILE_CHUNK_BYTES = 5 * 1024 * 1024;
var FileUploader = function(params, twit) {
  assert(params);
  assert(params.file_path, 'Must specify `file_path` to upload a file. Got: ' + params.file_path + '.');
  var self = this;
  self._file_path = params.file_path;
  self._twit = twit;
  self._isUploading = false;
  self._isFileStreamEnded = false;
};
FileUploader.prototype.upload = function(cb) {
  var self = this;
  self._initMedia(function(err, bodyObj, resp) {
    if (err) {
      cb(err);
      return;
    } else {
      var mediaTmpId = bodyObj.media_id_string;
      var chunkNumber = 0;
      var mediaFile = fs.createReadStream(self._file_path, {highWatermark: MAX_FILE_CHUNK_BYTES});
      mediaFile.on('data', function(chunk) {
        mediaFile.pause();
        self._isUploading = true;
        self._appendMedia(mediaTmpId, chunk.toString('base64'), chunkNumber, function(err, bodyObj, resp) {
          self._isUploading = false;
          if (err) {
            cb(err);
          } else {
            if (self._isUploadComplete()) {
              self._finalizeMedia(mediaTmpId, cb);
            } else {
              chunkNumber++;
              mediaFile.resume();
            }
          }
        });
      });
      mediaFile.on('end', function() {
        self._isFileStreamEnded = true;
        if (self._isUploadComplete()) {
          self._finalizeMedia(mediaTmpId, cb);
        }
      });
    }
  });
};
FileUploader.prototype._isUploadComplete = function() {
  return !this._isUploading && this._isFileStreamEnded;
};
FileUploader.prototype._finalizeMedia = function(media_id, cb) {
  var self = this;
  self._twit.post('media/upload', {
    command: 'FINALIZE',
    media_id: media_id
  }, cb);
};
FileUploader.prototype._appendMedia = function(media_id_string, chunk_part, segment_index, cb) {
  var self = this;
  self._twit.post('media/upload', {
    command: 'APPEND',
    media_id: media_id_string.toString(),
    segment_index: segment_index,
    media: chunk_part
  }, cb);
};
FileUploader.prototype._initMedia = function(cb) {
  var self = this;
  var mediaType = mime.lookup(self._file_path);
  var mediaFileSizeBytes = fs.statSync(self._file_path).size;
  if (mediaFileSizeBytes < MAX_FILE_SIZE_BYTES) {
    self._twit.post('media/upload', {
      'command': 'INIT',
      'media_type': mediaType,
      'total_bytes': mediaFileSizeBytes
    }, cb);
  } else {
    var errMsg = util.format('This file is too large. Max size is %dB. Got: %dB.', MAX_FILE_SIZE_BYTES, mediaFileSizeBytes);
    cb(new Error(errMsg));
  }
};
module.exports = FileUploader;
