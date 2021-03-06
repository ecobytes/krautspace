#!/usr/bin/env node
var Krautspace = require( '../' )
var color = require( 'chalk' )
var moment = require( 'moment-timezone' )
var tab = require( 'tab' )
var util = require( 'util' )
var log = console.log.bind( console )

var options = require( 'yargs' )
  .usage( 'Usage: krautspace [options] [command]' )
  .boolean( 'version' )
  .describe( 'version', 'Display version number' )
  .boolean( 'help' )
  .describe( 'help', 'Display usage help' )
  .boolean( 'color' )
  .describe( 'color', 'Force colored output (defaults to terminal color support)' )
  .boolean( 'no-color' )
  .describe( 'no-color', 'Force non-colored output' )
  .example( 'status', 'Display short status information (default)' )
  .example( 'info', 'Display verbose information' )
  // .example( 'events', 'Display upcoming calendar events' )
  .example( 'json', 'Output machine readable status data as JSON' )
  .alias({
    help: 'h',
    version: 'v'
  })

var argv = options.argv

if( argv.version ) {
  return log( require( '../package' ).version )
}

log( '' )

if( argv.help ) {
  return options.showHelp()
}

function inspect( value ) {
  log( util.inspect( value, {
    colors: color.supportsColor,
    depth: null
  }))
}

function FAIL( error ) {
  if( error != null ) {
    
    var msg = [
      color.red( '[ERROR]' ),
      error.message
    ]
    
    console.log( msg.join( ' ' ) )
    process.exit( 1 )
    
  }
}

function header( status ) {
  log( [
    color.green( '[KRAUTSPACE]' ),
    status.state.open ?
      color.yellow( '[OPEN]' ) :
      color.red( '[CLOSED]' ),
    '(' + moment( status.state.lastchange * 1e3 ).fromNow() + ')',
    '\n' + color.cyan( '[STATUS]' ),
    status.state.message,
  ].join( ' ' ) )
}

function contact( status ) {
  
  tab.emitTable({
    columns: [{
      label: '',
      align: 'left',
      width: 15,
    },{
      label: '',
      align: 'right',
    }],
    rowSeparator: '\n  ',
    rows: [
      [ 'Web',          color.cyan( status.url ) ],
      [ '', '' ],
      [ 'Twitter',      color.cyan( status.contact.twitter ) ],
      [ 'Email',        color.cyan( status.contact.email ) ],
      [ 'Mailing List', color.cyan( status.contact.ml ) ],
      [ 'Jabber',       color.cyan( status.contact.jabber ) ],
      [ 'Identica',     color.cyan( status.contact.identica ) ],
      [ '', '' ],
      [ 'Address',      color.cyan( status.location.address ) ],
      [ 'Location',     color.cyan( status.location.lat + ', ' + status.location.lon ) ],
    ]
  })
  
}

function feed( data ) {
  
  var items = data.items.slice( 0, 7 ).map( function( item ) {
    // var time = item.title.match( /(\d{1,2}:\d{1,2})/ )
    var time = moment.tz( item.published, 'Atlantic/St_Helena' )
    var open = /geöffnet/i.test( item.title )
    return { open: open, time: time }
  })
  
  var item, end
  var times = []
  
  while( item = items.shift() ) {
    if( item.open ) {
      times.push([
        item.time.format( 'dddd' ),
        item.time.format( 'HH:mm' ) +' - '+ 'now'
      ])
    } else {
      end = items.shift()
      end && times.push([
        end.time.format( 'dddd' ),
        end.time.format( 'HH:mm' ) +' - '+ item.time.format( 'HH:mm' )
      ])
    }
  }
  
  tab.emitTable({
    columns: [{
      label: '',
      align: 'left',
      width: 10,
    },{
      label: '',
    }],
    rowSeparator: '\n  ',
    rows: times
  })
  
}

function displayJSON() {
  Krautspace.getStatus( function( error, status ) {
    FAIL( error )
    console.log( status )
  })
}

function displayStatus() {
  Krautspace.getStatus( function( error, status ) {
    FAIL( error )
    header( status )
    Krautspace.getFeed( function( error, data ) {
      FAIL( error )
      feed( data )
    })
  })
}

function displayInfo() {
  Krautspace.getStatus( function( error, status ) {
    FAIL( error )
    header( status )
    contact( status )
    // inspect( status )
  })
}

switch( argv._.shift() ) {
  case 'json': displayJSON(); break
  case 'info': displayInfo(); break
  default: displayStatus(); break
}
