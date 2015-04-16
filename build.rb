#!/usr/bin/env ruby

require 'json'
require 'fileutils'

dist_dir = File.expand_path("../dist", __FILE__)

FileUtils.rm_rf Dir.glob("#{dist_dir}/*")

plugins = JSON.parse( File.read('bower.json') )["dependencies"].keys

plugins.delete("scribe")

`browserify vendor/scribe/scribe.js -s Scribe > dist/scribe.js`

plugins.each do |name|
  puts "- processing #{name}"
  `browserify vendor/#{name}/#{name}.js -s #{name} > dist/#{name}.js`
end