var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = 
  { "_id":'_design/streaming-xhr'
  , "rewrites": 
    [ {from:"/", to:'index.html'}
    , {from:"/db", to:'/../../'}
    , {from:"/db/*", to:'/../../*'}
    , {from:"/*", to:'*'}
    ]
  };

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;