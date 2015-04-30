#!/usr/bin/env ruby

require 'json'
require 'fileutils'

dist_dir = File.expand_path("../dist", __FILE__)

beautify           = system("which js-beautify")
beautifier_options = "pBkb end-expand -m2"

FileUtils.rm_rf Dir.glob("#{dist_dir}/*")

plugins = JSON.parse( File.read('package.json') )["dependencies"].keys.select! { |key| key != 'scribe-editor' && /^scribe-/ =~ key }

`browserify --global-transform deamdify -s Scribe node_modules/scribe-editor > dist/scribe.js`

if beautify
  `js-beautify -r#{beautifier_options} dist/scribe.js`
end

plugins.each do |name|
  puts "- processing #{name}"
  
  `browserify --global-transform deamdify  node_modules/#{name} -s #{name} > dist/#{name}.js`
  
  if beautify
    `js-beautify -r#{beautifier_options} dist/#{name}.js`
  end
end